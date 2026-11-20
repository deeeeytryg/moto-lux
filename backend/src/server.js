import { config } from './config.js'
import { buildApp } from './app.js'

buildApp().listen(config.port, () => {
  console.log(`MotoLux API escuchando en el puerto ${config.port}`)
  if (config.generatedAdminPassword) console.log(`Admin de desarrollo → ${config.adminEmail} / ${config.generatedAdminPassword}`)
  if (!config.anthropicKey) console.warn('⚠ Falta ANTHROPIC_API_KEY: el chatbot responderá 503 hasta configurarla.')
})
