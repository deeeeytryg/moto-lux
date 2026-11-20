import { randomBytes } from 'node:crypto'

/*
 * Toda la configuración sale de variables de entorno. En producción faltar una
 * variable crítica detiene el servidor, para no publicar una app insegura por error.
 */
const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  for (const key of ['ADMIN_EMAIL', 'ADMIN_PASSWORD', 'ADMIN_SESSION_SECRET', 'ALLOWED_ORIGINS']) {
    if (!process.env[key]) throw new Error(`Falta la variable de entorno ${key}`)
  }
}

// En desarrollo, si no defines ADMIN_PASSWORD se genera una al azar y se muestra en la consola.
// Nunca hay una contraseña escrita en el código (el repositorio es público).
const devPassword = isProd ? '' : randomBytes(9).toString('base64url')

export const config = {
  isProd,
  port: Number(process.env.PORT ?? 3001),
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean),
  adminEmail: process.env.ADMIN_EMAIL ?? 'admin@motolux.co',
  adminPassword: process.env.ADMIN_PASSWORD ?? devPassword,
  sessionSecret: process.env.ADMIN_SESSION_SECRET ?? randomBytes(32).toString('hex'),
  sessionHours: 8,
  anthropicKey: process.env.ANTHROPIC_API_KEY ?? '',
  anthropicUrl: process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com',
  aiModel: process.env.AI_MODEL ?? 'claude-haiku-5-5',
  dbPath: process.env.DB_PATH ?? './data/motolux.db',
  generatedAdminPassword: process.env.ADMIN_PASSWORD ? '' : devPassword,
  seedDemo: process.env.SEED_DEMO ? process.env.SEED_DEMO === 'true' : !isProd,
}
