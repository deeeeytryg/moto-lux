// Cliente de la API: único lugar del frontend que habla con el backend.
const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
export const getToken = () => sessionStorage.getItem('motolux_token')
export const setToken = (t) => (t ? sessionStorage.setItem('motolux_token', t) : sessionStorage.removeItem('motolux_token'))

export async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (getToken()) headers.Authorization = `Bearer ${getToken()}`
  let res
  try { res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined }) }
  catch { throw new Error('No hay conexión con el servidor. Intenta de nuevo.') }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) { const e = new Error(data.error ?? 'Error inesperado'); e.status = res.status; e.fieldErrors = data.fieldErrors; throw e }
  return data
}
export const cop = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v)
export const dur = (m) => { const h = Math.floor(m / 60), r = m % 60; return h === 0 ? `${r} min` : r === 0 ? `${h} h` : `${h} h ${r} min` }
export const img = (n) => `${import.meta.env.BASE_URL}images/${n}`
