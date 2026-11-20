import { DatabaseSync } from 'node:sqlite'
import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { config } from './config.js'
import { CLOSING_HOUR, OPENING_HOUR, SEED_SERVICES } from './catalog.js'
import { isoDate, localParts } from './dates.js'

/*
 * Capa de datos con SQLite (base de datos real, un solo archivo, sin instalar nada).
 * Todo el backend habla con la base SOLO a través de las funciones exportadas aquí,
 * así que cambiar a PostgreSQL más adelante solo exige reescribir este archivo.
 */

if (config.dbPath !== ':memory:') mkdirSync(dirname(config.dbPath), { recursive: true })
const db = new DatabaseSync(config.dbPath)
db.exec('PRAGMA journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    cilindraje TEXT NOT NULL,
    description TEXT NOT NULL,
    price_from INTEGER NOT NULL,
    duration_min INTEGER NOT NULL,
    active INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    client_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    motorcycle TEXT NOT NULL,
    service_id TEXT NOT NULL REFERENCES services(id),
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pendiente',
    source TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  -- Evita doble reserva a nivel de base de datos: un horario no puede tener dos citas activas.
  CREATE UNIQUE INDEX IF NOT EXISTS uq_slot_active ON appointments(date, time) WHERE status != 'cancelada';
  CREATE TABLE IF NOT EXISTS clients (
    phone TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL DEFAULT '',
    motorcycles TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
`)

/* ---------- Conversión fila -> objeto (camelCase para el frontend) ---------- */

const toService = (r) => ({
  id: r.id,
  name: r.name,
  category: r.category,
  cilindraje: r.cilindraje,
  description: r.description,
  priceFrom: r.price_from,
  durationMin: r.duration_min,
  active: Boolean(r.active),
})

const toAppointment = (r) => ({
  id: r.id,
  clientName: r.client_name,
  phone: r.phone,
  motorcycle: r.motorcycle,
  serviceId: r.service_id,
  date: r.date,
  time: r.time,
  notes: r.notes,
  status: r.status,
  source: r.source,
  createdAt: r.created_at,
})

/* ---------- Servicios ---------- */

export function listServices({ activeOnly = false } = {}) {
  const rows = db
    .prepare(`SELECT * FROM services ${activeOnly ? 'WHERE active = 1' : ''} ORDER BY rowid`)
    .all()
  return rows.map(toService)
}

export function getService(id) {
  const row = db.prepare('SELECT * FROM services WHERE id = ?').get(id)
  return row ? toService(row) : null
}

export function insertService(s) {
  db.prepare(
    `INSERT INTO services (id, name, category, cilindraje, description, price_from, duration_min, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(s.id, s.name, s.category, s.cilindraje, s.description, s.priceFrom, s.durationMin, s.active ? 1 : 0)
}

export function createService(input) {
  const base = input.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  const id = getService(base) ? `${base}-${Date.now().toString(36)}` : base
  insertService({ ...input, id, active: true })
  return getService(id)
}

export function updateService(id, patch) {
  if (!getService(id)) return null
  if (patch.active !== undefined) db.prepare('UPDATE services SET active = ? WHERE id = ?').run(patch.active ? 1 : 0, id)
  if (patch.priceFrom !== undefined) db.prepare('UPDATE services SET price_from = ? WHERE id = ?').run(patch.priceFrom, id)
  return getService(id)
}

/* ---------- Disponibilidad y citas ---------- */

export function getAvailableSlots(date) {
  const day = new Date(`${date}T12:00:00`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(day.getTime()))
    return { open: false, slots: [], reason: 'Fecha inválida' }
  if (day.getDay() === 0) return { open: false, slots: [], reason: 'Los domingos el taller está cerrado' }

  const { date: today, hour: nowHour } = localParts()
  if (date < today) return { open: false, slots: [], reason: 'La fecha ya pasó' }

  const taken = new Set(
    db.prepare("SELECT time FROM appointments WHERE date = ? AND status != 'cancelada'").all(date).map((r) => r.time),
  )
  const slots = []
  for (let h = OPENING_HOUR; h < CLOSING_HOUR; h++) {
    const time = `${String(h).padStart(2, '0')}:00`
    if (date === today && h <= nowHour) continue // horas que ya pasaron hoy
    if (!taken.has(time)) slots.push(time)
  }
  return { open: true, slots, reason: slots.length ? '' : 'No quedan horarios libres ese día' }
}

/** Lanza Error con un mensaje claro si no se puede agendar. */
export function createAppointment(input) {
  const service = getService(input.serviceId)
  if (!service || !service.active) throw new Error('El servicio seleccionado no está disponible')

  const { slots, reason } = getAvailableSlots(input.date)
  if (!slots.includes(input.time)) throw new Error(reason || 'Ese horario ya no está disponible')

  const appointment = {
    id: randomUUID(),
    clientName: input.clientName.trim(),
    phone: input.phone.replace(/\D/g, ''),
    motorcycle: input.motorcycle.trim(),
    serviceId: service.id,
    date: input.date,
    time: input.time,
    notes: input.notes?.trim() ?? '',
    status: 'pendiente',
    source: input.source,
    createdAt: new Date().toISOString(),
  }
  try {
    db.prepare(
      `INSERT INTO appointments (id, client_name, phone, motorcycle, service_id, date, time, notes, status, source, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      appointment.id, appointment.clientName, appointment.phone, appointment.motorcycle, appointment.serviceId,
      appointment.date, appointment.time, appointment.notes, appointment.status, appointment.source, appointment.createdAt,
    )
  } catch {
    // Dos personas reservando a la vez: el índice único rechaza la segunda.
    throw new Error('Ese horario ya no está disponible')
  }
  upsertClient({ name: appointment.clientName, phone: appointment.phone, email: input.email ?? '', motorcycle: appointment.motorcycle })
  return appointment
}

export function listAppointments() {
  return db.prepare('SELECT * FROM appointments ORDER BY date, time').all().map(toAppointment)
}

export function updateAppointmentStatus(id, status) {
  const r = db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, id)
  return r.changes > 0
}

export function deleteAppointment(id) {
  return db.prepare('DELETE FROM appointments WHERE id = ?').run(id).changes > 0
}

/* ---------- Clientes ---------- */

function upsertClient({ name, phone, email, motorcycle }) {
  const existing = db.prepare('SELECT * FROM clients WHERE phone = ?').get(phone)
  if (existing) {
    const bikes = JSON.parse(existing.motorcycles)
    if (motorcycle && !bikes.includes(motorcycle)) bikes.push(motorcycle)
    db.prepare('UPDATE clients SET name = ?, email = ?, motorcycles = ? WHERE phone = ?').run(
      name, email || existing.email, JSON.stringify(bikes), phone,
    )
    return
  }
  db.prepare('INSERT INTO clients (phone, name, email, motorcycles, created_at) VALUES (?, ?, ?, ?, ?)').run(
    phone, name, email, JSON.stringify(motorcycle ? [motorcycle] : []), new Date().toISOString(),
  )
}

export function listClients() {
  const counts = new Map(
    db.prepare('SELECT phone, COUNT(*) AS n FROM appointments GROUP BY phone').all().map((r) => [r.phone, r.n]),
  )
  return db.prepare('SELECT * FROM clients ORDER BY created_at DESC').all().map((c) => ({
    phone: c.phone,
    name: c.name,
    email: c.email,
    motorcycles: JSON.parse(c.motorcycles),
    createdAt: c.created_at,
    appointments: counts.get(c.phone) ?? 0,
  }))
}

/* ---------- Mensajes de contacto ---------- */

export function addContactMessage({ name, email, phone, message }) {
  const id = randomUUID()
  db.prepare('INSERT INTO messages (id, name, email, phone, message, read, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)').run(
    id, name, email, phone, message, new Date().toISOString(),
  )
  return id
}

export function listMessages() {
  return db.prepare('SELECT * FROM messages ORDER BY created_at DESC').all().map((m) => ({
    id: m.id, name: m.name, email: m.email, phone: m.phone, message: m.message,
    read: Boolean(m.read), createdAt: m.created_at,
  }))
}

export function markMessageRead(id) {
  return db.prepare('UPDATE messages SET read = 1 WHERE id = ?').run(id).changes > 0
}

/* ---------- Datos iniciales ---------- */

if (db.prepare('SELECT COUNT(*) AS n FROM services').get().n === 0) {
  for (const s of SEED_SERVICES) insertService(s)
}

if (config.seedDemo && db.prepare('SELECT COUNT(*) AS n FROM appointments').get().n === 0) {
  const demo = [
    ['Andrés Gómez', '3104567890', 'Yamaha MT-09 2023', 'ceramico', 1, '09:00', 'Quiere protección para viaje largo.', 'confirmada', 'chatbot'],
    ['Laura Martínez', '3159876543', 'Honda CB190R', 'mantenimiento-bajo', 1, '11:00', '', 'pendiente', 'web'],
    ['Camilo Rojas', '3001112233', 'BMW R 1250 GS', 'mantenimiento-alto', 2, '08:00', 'Revisar ruido en suspensión trasera.', 'pendiente', 'chatbot'],
    ['Valentina Ríos', '3207654321', 'Bajaj Pulsar NS200', 'detailing-completo', -2, '14:00', '', 'completada', 'admin'],
  ]
  for (const [clientName, phone, motorcycle, serviceId, offset, time, notes, status, source] of demo) {
    const id = randomUUID()
    const date = isoDate(offset)
    db.prepare(
      `INSERT OR IGNORE INTO appointments (id, client_name, phone, motorcycle, service_id, date, time, notes, status, source, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, clientName, phone, motorcycle, serviceId, date, time, notes, status, source, new Date().toISOString())
    upsertClient({ name: clientName, phone, email: '', motorcycle })
  }
  addContactMessage({
    name: 'Sebastián Torres',
    email: 'sebastian@correo.com',
    phone: '3012223344',
    message: '¿Hacen recubrimiento cerámico para una Ducati Panigale? ¿Cuánto tiempo tarda?',
  })
}
