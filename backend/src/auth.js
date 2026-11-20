import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { config } from './config.js'

/*
 * Sesión del administrador con un token firmado (HMAC-SHA256), formato: carga.firma
 * Como el frontend vive en otro dominio (GitHub Pages), el token viaja en el encabezado
 * Authorization: Bearer <token>. El servidor valida firma y expiración en cada petición.
 */

const b64 = (s) => Buffer.from(s).toString('base64url')
const sign = (payload) => createHmac('sha256', config.sessionSecret).update(payload).digest('base64url')

// Se comparan los hashes (misma longitud siempre) para que el tiempo de respuesta no filtre datos.
function safeEqual(a, b) {
  const ha = createHash('sha256').update(String(a)).digest()
  const hb = createHash('sha256').update(String(b)).digest()
  return timingSafeEqual(ha, hb)
}

export function verifyCredentials(email, password) {
  const emailOk = safeEqual(String(email).trim().toLowerCase(), config.adminEmail.toLowerCase())
  const passOk = safeEqual(password, config.adminPassword)
  return emailOk && passOk
}

export function createToken() {
  const payload = b64(JSON.stringify({ email: config.adminEmail, exp: Date.now() + config.sessionHours * 3600_000 }))
  return `${payload}.${sign(payload)}`
}

/** Devuelve { email } si el token es válido y no ha expirado; si no, null. */
export function readToken(header) {
  const token = header?.startsWith('Bearer ') ? header.slice(7) : ''
  const [payload, signature] = token.split('.')
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return data.exp > Date.now() ? { email: data.email } : null
  } catch {
    return null
  }
}
