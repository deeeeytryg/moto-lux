import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
process.env.DB_PATH = ':memory:'
process.env.ADMIN_EMAIL = 'admin@motolux.co'
process.env.ADMIN_PASSWORD = 'clave-de-prueba-123'
process.env.ADMIN_SESSION_SECRET = 'x'.repeat(32)
const { buildApp } = await import('../src/app.js')
const { isoDate } = await import('../src/dates.js')
let server, base
before(() => new Promise((r) => { server = buildApp().listen(0, () => { base = `http://localhost:${server.address().port}`; r() }) }))
after(() => server.close())
const j = (p, o) => fetch(base + p, o).then(async (r) => ({ status: r.status, body: await r.json() }))
test('servicios públicos', async () => { const r = await j('/api/services'); assert.equal(r.status, 200); assert.ok(r.body.services.length > 0) })
test('admin exige login', async () => { assert.equal((await j('/api/admin/data')).status, 401) })
test('login y datos', async () => {
  const bad = await j('/api/admin/login', { method: 'POST', body: JSON.stringify({ email: 'a@a.co', password: 'x' }) })
  assert.equal(bad.status, 401)
  const ok = await j('/api/admin/login', { method: 'POST', body: JSON.stringify({ email: 'admin@motolux.co', password: 'clave-de-prueba-123' }) })
  const d = await j('/api/admin/data', { headers: { Authorization: `Bearer ${ok.body.token}` } })
  assert.equal(d.status, 200)
})
test('contacto valida y guarda', async () => {
  assert.equal((await j('/api/contact', { method: 'POST', body: JSON.stringify({ name: 'a' }) })).status, 400)
})
test('no permite doble reserva', async () => {
  const { body } = await j('/api/admin/login', { method: 'POST', body: JSON.stringify({ email: 'admin@motolux.co', password: 'clave-de-prueba-123' }) })
  let date = isoDate(3); if (new Date(date + 'T12:00:00').getDay() === 0) date = isoDate(4)
  const cita = { clientName: 'Test Uno', phone: '3001234567', motorcycle: 'Honda', serviceId: 'frenos', date, time: '10:00' }
  const h = { Authorization: `Bearer ${body.token}` }
  assert.equal((await j('/api/admin/appointments', { method: 'POST', headers: h, body: JSON.stringify(cita) })).status, 200)
  assert.equal((await j('/api/admin/appointments', { method: 'POST', headers: h, body: JSON.stringify(cita) })).status, 400)
})
