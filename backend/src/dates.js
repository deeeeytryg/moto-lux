/*
 * El taller está en Colombia (UTC-5). toISOString() devuelve la fecha en UTC, y el servidor
 * (por ejemplo en la nube) también corre en UTC, así que se fija la zona horaria explícitamente.
 */
const TIMEZONE = 'America/Bogota'

export function localParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (type) => parts.find((p) => p.type === type)?.value ?? ''
  return { date: `${get('year')}-${get('month')}-${get('day')}`, hour: Number(get('hour')) }
}

export function isoDate(offsetDays = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return localParts(d).date
}
