import { config } from './config.js'
import { BUSINESS, CATEGORY_LABEL, CILINDRAJE_LABEL, formatCOP, formatDuration } from './catalog.js'
import { createAppointment, getAvailableSlots, listServices } from './db.js'
import { localParts } from './dates.js'
import { HttpError } from './http.js'

/*
 * Chatbot "Lux": usa la API de Anthropic directamente (sin SDK) con herramientas (tool use).
 * El modelo puede llamar a consultarDisponibilidad y agendarCita; el servidor ejecuta esas
 * funciones contra la base de datos real y le devuelve el resultado, hasta que responde con texto.
 */

function buildSystemPrompt() {
  const now = new Date()
  const today = now.toLocaleDateString('es-CO', {
    timeZone: 'America/Bogota', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  const catalog = listServices({ activeOnly: true })
    .map(
      (s) =>
        `- [${s.id}] ${s.name} (${CATEGORY_LABEL[s.category]}, ${CILINDRAJE_LABEL[s.cilindraje]}): desde ${formatCOP(s.priceFrom)}, duración aprox. ${formatDuration(s.durationMin)}. ${s.description}`,
    )
    .join('\n')

  return `Eres "Lux", el asistente virtual de ${BUSINESS.name}, un taller especializado en detailing premium y mecánica para motocicletas de bajo y alto cilindraje.

TONO DE MARCA:
- Cercano, elegante y apasionado por las motos. Tuteas al cliente.
- Respuestas breves (2 a 4 frases), claras y sin tecnicismos innecesarios.
- Transmites confianza, cuidado por el detalle y calidad premium. Puedes usar expresiones moteras con moderación ("rodar", "tu nave").
- Escribe en texto plano, sin markdown, sin asteriscos ni tablas. Para listas usa guiones simples.

INFORMACIÓN DEL NEGOCIO:
- Horario: ${BUSINESS.hours}. Domingos cerrado. Citas cada hora entre 8:00 y 16:00.
- Teléfono / WhatsApp: ${BUSINESS.phone}
- No compartas dirección ni correo electrónico; si preguntan, indica que el contacto es por WhatsApp o llamada al ${BUSINESS.phone}.
- Hoy es ${today} (${localParts(now).date}).

CATÁLOGO ACTUAL (los precios son "desde" y pueden variar según el estado y modelo de la moto):
${catalog}

CÓMO AGENDAR UNA CITA:
1. Identifica el servicio adecuado. Si el cliente no sabe, pregúntale por su moto (marca, modelo, cilindraje) y qué necesita, y recomiéndale el servicio. Para mantenimiento, motos hasta 250cc son bajo cilindraje y desde 300cc alto cilindraje.
2. Pregunta la fecha deseada y usa la herramienta consultarDisponibilidad antes de proponer horarios. Convierte expresiones como "mañana" o "el viernes" a formato AAAA-MM-DD.
3. Pide nombre completo, teléfono celular y la moto (marca y modelo) si aún no los tienes.
4. Antes de agendar, resume los datos y pide confirmación explícita.
5. Solo después de la confirmación usa agendarCita. Si falla, explica el motivo y ofrece alternativas.

REGLAS:
- Nunca inventes servicios, precios ni horarios que no estén en el catálogo o en la herramienta.
- Si preguntan algo fuera del mundo de las motos o del taller, redirige amablemente.
- Para diagnósticos complejos, recomienda el Diagnóstico Electrónico o una visita al taller.`
}

function buildTools(serviceIds) {
  return [
    {
      name: 'consultarDisponibilidad',
      description: 'Consulta los horarios libres del taller para una fecha específica.',
      input_schema: {
        type: 'object',
        properties: { fecha: { type: 'string', description: 'Fecha en formato AAAA-MM-DD' } },
        required: ['fecha'],
      },
    },
    {
      name: 'agendarCita',
      description: 'Agenda una cita en el taller. Úsala solo después de que el cliente confirme todos los datos.',
      input_schema: {
        type: 'object',
        properties: {
          nombre: { type: 'string', description: 'Nombre completo del cliente' },
          telefono: { type: 'string', description: 'Teléfono celular del cliente' },
          moto: { type: 'string', description: 'Marca y modelo de la moto' },
          servicioId: { type: 'string', enum: serviceIds, description: 'ID del servicio del catálogo' },
          fecha: { type: 'string', description: 'Fecha en formato AAAA-MM-DD' },
          hora: { type: 'string', description: 'Hora en formato HH:00' },
          notas: { type: 'string', description: 'Detalles adicionales del cliente' },
        },
        required: ['nombre', 'telefono', 'moto', 'servicioId', 'fecha', 'hora'],
      },
    },
  ]
}

/** Ejecuta una herramienta pedida por el modelo. Devuelve { result, booking? }. */
function runTool(name, input) {
  if (name === 'consultarDisponibilidad') return { result: getAvailableSlots(String(input.fecha ?? '')) }

  if (name === 'agendarCita') {
    try {
      const a = createAppointment({
        clientName: String(input.nombre ?? ''),
        phone: String(input.telefono ?? ''),
        motorcycle: String(input.moto ?? ''),
        serviceId: String(input.servicioId ?? ''),
        date: String(input.fecha ?? ''),
        time: String(input.hora ?? ''),
        notes: input.notas ? String(input.notas) : '',
        source: 'chatbot',
      })
      const service = listServices().find((s) => s.id === a.serviceId)
      const booking = {
        ok: true,
        id: a.id.slice(0, 8).toUpperCase(),
        servicio: service?.name ?? a.serviceId,
        fecha: a.date,
        hora: a.time,
        moto: a.motorcycle,
        nombre: a.clientName,
      }
      return { result: booking, booking }
    } catch (error) {
      const failure = { ok: false, error: error.message }
      return { result: failure, booking: failure }
    }
  }
  return { result: { error: 'Herramienta desconocida' } }
}

/** Limpia el historial que manda el navegador: solo texto, límites de tamaño y de cantidad. */
export function sanitizeMessages(raw) {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 30) throw new HttpError(400, 'Conversación inválida')
  const messages = raw.map((m) => {
    const role = m?.role === 'assistant' ? 'assistant' : 'user'
    const content = typeof m?.content === 'string' ? m.content.trim().slice(0, 1000) : ''
    return { role, content }
  })
  if (messages.some((m) => !m.content) || messages.at(-1).role !== 'user') throw new HttpError(400, 'Conversación inválida')
  return messages
}

export async function chat(rawMessages) {
  if (!config.anthropicKey) throw new HttpError(503, 'El asistente no está configurado todavía.')
  const history = sanitizeMessages(rawMessages)
  const messages = history.map((m) => ({ role: m.role, content: m.content }))
  const tools = buildTools(listServices({ activeOnly: true }).map((s) => s.id))
  const system = buildSystemPrompt()
  let booking = null

  for (let step = 0; step < 5; step++) {
    let response
    try {
      response = await fetch(`${config.anthropicUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': config.anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({ model: config.aiModel, max_tokens: 700, system, tools, messages }),
        signal: AbortSignal.timeout(25_000),
      })
    } catch {
      throw new HttpError(502, 'No pudimos conectar con el asistente.')
    }
    if (!response.ok) {
      console.error('Error de la API de IA:', response.status, await response.text().catch(() => ''))
      throw new HttpError(502, 'El asistente no pudo responder en este momento.')
    }

    const data = await response.json()
    const toolCalls = data.content.filter((b) => b.type === 'tool_use')

    if (data.stop_reason !== 'tool_use' || toolCalls.length === 0) {
      const reply = data.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim()
      return { reply: reply || 'Listo.', booking }
    }

    // El modelo pidió herramientas: se ejecutan y se le devuelven los resultados.
    messages.push({ role: 'assistant', content: data.content })
    const results = toolCalls.map((call) => {
      const out = runTool(call.name, call.input ?? {})
      if (out.booking) booking = out.booking
      return { type: 'tool_result', tool_use_id: call.id, content: JSON.stringify(out.result) }
    })
    messages.push({ role: 'user', content: results })
  }
  return { reply: 'Necesito un momento más para ayudarte. ¿Puedes repetirme tu solicitud?', booking }
}
