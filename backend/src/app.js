import { createApp } from './http.js'
import { registerRoutes } from './routes.js'

export function buildApp() {
  const app = createApp()
  registerRoutes(app)
  return app.server
}
