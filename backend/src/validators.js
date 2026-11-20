import { HttpError } from './http.js'

/* Validaciones de entrada (el servidor nunca confía en lo que envía el navegador). */

const str = (v) => (typeof v === 'string' ? v.trim() : '')

function fail(message) {
  throw new HttpError(400, message)
}

export function parseContact(b) {
  const name = str(b.name)
  const email = str(b.email)
  const phone = str(b.phone)
  const message = str(b.message)
  const fieldErrors = {}
  if (name.length < 2 || name.length > 80) fieldErrors.name = 'Escribe tu nombre'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) fieldErrors.email = 'Correo inválido'
  if (!/^[\d\s+()-]{7,20}$/.test(phone)) fieldErrors.phone = 'Teléfono inválido'
  if (message.length < 10 || message.length > 1000) fieldErrors.message = 'Cuéntanos un poco más (mínimo 10 caracteres)'
  if (Object.keys(fieldErrors).length) {
    const error = new HttpError(400, 'Revisa los campos marcados.')
    error.fieldErrors = fieldErrors
    throw error
  }
  return { name, email, phone, message }
}

export function parseAppointment(b) {
  const clientName = str(b.clientName)
  const phone = str(b.phone)
  const motorcycle = str(b.motorcycle)
  if (clientName.length < 2) fail('Nombre requerido')
  if (phone.replace(/\D/g, '').length < 7) fail('Teléfono requerido')
  if (motorcycle.length < 2) fail('Moto requerida')
  if (!str(b.serviceId)) fail('Selecciona un servicio')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str(b.date))) fail('Fecha inválida')
  if (!/^\d{2}:00$/.test(str(b.time))) fail('Hora inválida')
  return {
    clientName, phone, motorcycle,
    serviceId: str(b.serviceId), date: str(b.date), time: str(b.time),
    notes: str(b.notes).slice(0, 300),
  }
}

export function parseService(b) {
  const name = str(b.name)
  const description = str(b.description)
  const priceFrom = Number(b.priceFrom)
  const durationMin = Number(b.durationMin)
  if (name.length < 3 || name.length > 80) fail('Nombre muy corto')
  if (!['detailing', 'mecanica'].includes(b.category)) fail('Categoría inválida')
  if (!['todas', 'bajo', 'alto'].includes(b.cilindraje)) fail('Cilindraje inválido')
  if (description.length < 10 || description.length > 400) fail('Describe el servicio (10 a 400 caracteres)')
  if (!Number.isInteger(priceFrom) || priceFrom < 0 || priceFrom > 50_000_000) fail('Precio inválido')
  if (!Number.isInteger(durationMin) || durationMin < 15 || durationMin > 1440) fail('Duración inválida')
  return { name, category: b.category, cilindraje: b.cilindraje, description, priceFrom, durationMin }
}

export const APPOINTMENT_STATUSES = ['pendiente', 'confirmada', 'completada', 'cancelada']
