import { chat } from './ai.js'
import { createToken, readToken, verifyCredentials } from './auth.js'
import { HttpError, rateLimit } from './http.js'
import {
  APPOINTMENT_STATUSES, parseAppointment, parseContact, parseService,
} from './validators.js'
import * as db from './db.js'

/** Registra todas las rutas de la API en la app. */
export function registerRoutes(app) {
  const requireAdmin = (req) => {
    const session = readToken(req.headers.authorization)
    if (!session) throw new HttpError(401, 'No autorizado')
    return session
  }

  /* ---------- Públicas ---------- */

  app.get('/api/health', () => ({ ok: true }))

  app.get('/api/services', () => ({ services: db.listServices({ activeOnly: true }) }))

  app.get('/api/availability', ({ query }) => db.getAvailableSlots(query.get('date') ?? ''))

  app.post('/api/contact', ({ req, body }) => {
    rateLimit(req, 'contact', 5, 10 * 60_000)
    db.addContactMessage(parseContact(body))
    return { message: '¡Mensaje recibido! Te responderemos en menos de 24 horas.' }
  })

  app.post('/api/chat', async ({ req, body }) => {
    rateLimit(req, 'chat', 20, 60_000)
    return chat(body.messages)
  })

  /* ---------- Administrador ---------- */

  app.post('/api/admin/login', ({ req, body }) => {
    rateLimit(req, 'login', 5, 60_000)
    const { email, password } = body
    if (!email || !password) throw new HttpError(400, 'Ingresa tu correo y contraseña.')
    if (!verifyCredentials(email, password)) throw new HttpError(401, 'Credenciales incorrectas.')
    return { token: createToken(), email: String(email).trim().toLowerCase() }
  })

  app.get('/api/admin/me', ({ req }) => requireAdmin(req))

  app.get('/api/admin/data', ({ req }) => {
    requireAdmin(req)
    return {
      appointments: db.listAppointments(),
      clients: db.listClients(),
      services: db.listServices(),
      messages: db.listMessages(),
    }
  })

  app.post('/api/admin/appointments', ({ req, body }) => {
    requireAdmin(req)
    try {
      db.createAppointment({ ...parseAppointment(body), source: 'admin' })
    } catch (error) {
      if (error instanceof HttpError) throw error
      throw new HttpError(400, error.message)
    }
    return { message: 'Cita creada correctamente.' }
  })

  app.patch('/api/admin/appointments/:id', ({ req, params, body }) => {
    requireAdmin(req)
    if (!APPOINTMENT_STATUSES.includes(body.status)) throw new HttpError(400, 'Estado inválido')
    if (!db.updateAppointmentStatus(params.id, body.status)) throw new HttpError(404, 'Cita no encontrada')
  })

  app.delete('/api/admin/appointments/:id', ({ req, params }) => {
    requireAdmin(req)
    if (!db.deleteAppointment(params.id)) throw new HttpError(404, 'Cita no encontrada')
  })

  app.post('/api/admin/services', ({ req, body }) => {
    requireAdmin(req)
    db.createService(parseService(body))
    return { message: 'Servicio agregado al catálogo.' }
  })

  app.patch('/api/admin/services/:id', ({ req, params, body }) => {
    requireAdmin(req)
    const patch = {}
    if (body.active !== undefined) patch.active = Boolean(body.active)
    if (body.priceFrom !== undefined) {
      const price = Number(body.priceFrom)
      if (!Number.isInteger(price) || price < 0 || price > 50_000_000) throw new HttpError(400, 'Precio inválido')
      patch.priceFrom = price
    }
    if (!db.updateService(params.id, patch)) throw new HttpError(404, 'Servicio no encontrado')
  })

  app.patch('/api/admin/messages/:id/read', ({ req, params }) => {
    requireAdmin(req)
    if (!db.markMessageRead(params.id)) throw new HttpError(404, 'Mensaje no encontrado')
  })
}
