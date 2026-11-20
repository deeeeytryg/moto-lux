import { createServer } from 'node:http'
import { config } from './config.js'

/*
 * Mini-framework HTTP sin dependencias: rutas con parámetros (/api/x/:id), lectura de JSON,
 * CORS, encabezados de seguridad y limitador de peticiones por IP.
 */

export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const hits = new Map()

/** Lanza 429 si la IP supera `max` peticiones en `windowMs` para ese `bucket`. */
export function rateLimit(req, bucket, max, windowMs) {
  const key = `${bucket}:${req.socket.remoteAddress}`
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  if (recent.length >= max) throw new HttpError(429, 'Demasiadas solicitudes. Intenta de nuevo en un momento.')
  recent.push(now)
  hits.set(key, recent)
}

setInterval(() => hits.clear(), 10 * 60_000).unref()

async function readJson(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > 50_000) throw new HttpError(413, 'Solicitud demasiado grande')
    chunks.push(chunk)
  }
  if (size === 0) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString())
  } catch {
    throw new HttpError(400, 'JSON inválido')
  }
}

export function createApp() {
  const routes = []
  const add = (method) => (path, handler) => {
    const keys = []
    const regex = new RegExp('^' + path.replace(/:(\w+)/g, (_, k) => (keys.push(k), '([^/]+)')) + '$')
    routes.push({ method, regex, keys, handler })
  }

  const send = (res, status, body) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify(body))
  }

  const server = createServer(async (req, res) => {
    const origin = req.headers.origin
    if (origin && config.allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin)
      res.setHeader('Vary', 'Origin')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
    }
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Cache-Control', 'no-store')
    if (req.method === 'OPTIONS') return void res.writeHead(204).end()

    try {
      const url = new URL(req.url, 'http://localhost')
      for (const route of routes) {
        if (route.method !== req.method) continue
        const match = route.regex.exec(url.pathname)
        if (!match) continue
        const params = Object.fromEntries(route.keys.map((k, i) => [k, decodeURIComponent(match[i + 1])]))
        const body = req.method === 'GET' || req.method === 'DELETE' ? {} : await readJson(req)
        const result = await route.handler({ req, params, query: url.searchParams, body })
        return send(res, 200, result ?? { ok: true })
      }
      throw new HttpError(404, 'Ruta no encontrada')
    } catch (error) {
      if (error instanceof HttpError) return send(res, error.status, { error: error.message, fieldErrors: error.fieldErrors })
      console.error(error)
      send(res, 500, { error: 'Error interno del servidor' })
    }
  })

  return { server, get: add('GET'), post: add('POST'), patch: add('PATCH'), delete: add('DELETE') }
}
