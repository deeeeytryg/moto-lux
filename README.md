# MotoLux 🏍️ — Detailing premium y mecánica para motos

Proyecto final · Ruta Avanzada · Jóvenes creaTIvos. App web full stack **sin Vercel**:
frontend en **GitHub Pages** y backend en **Render** (o Railway / Fly / VPS).

- **App publicada:** https://deeeeytryg.github.io/moto-lux/
- **Repositorio:** https://github.com/deeeeytryg/moto-lux
- **Equipo:** _(nombres)_
- **Admin de demostración:** `https://deeeeytryg.github.io/TU_REPO/#/admin` — usuario y contraseña se entregan aparte a los jurados (nunca se escriben en el código).

## Entregables

| Requisito | Dónde está |
|---|---|
| Marca + home | `frontend/src/pages/Home.jsx`, `components/Header.jsx`, `Footer.jsx` |
| Catálogo | `Home.jsx` (sección Servicios) ← `GET /api/services` |
| Contacto real | `Home.jsx` (formulario) → `POST /api/contact` → tabla `messages` |
| Admin con login | `pages/Admin.jsx` ← `backend/src/auth.js` (token HMAC, 8 h) |
| IA personalizada "Lux" | `components/Chat.jsx` ← `backend/src/ai.js` (Claude con herramientas) |
| Animaciones | Framer Motion (entradas al hacer scroll) |
| Responsive | Tailwind, menú móvil en `Header.jsx` |

## Arquitectura

```
frontend/  React + Vite + Tailwind          → GitHub Pages (HashRouter)
  src/api.js        único lugar que habla con el backend
  src/pages/        Home y Admin
  src/components/   Header, Process, Footer, Chat
backend/   Node 22, sin dependencias         → Render
  src/routes.js     rutas de la API
  src/db.js         SQLite (node:sqlite): único archivo que toca la base
  src/auth.js       sesión firmada con HMAC
  src/ai.js         chatbot: prompt con catálogo + herramientas
  src/validators.js validación de entradas
  test/             pruebas (npm test)
```

**Decisión técnica:** GitHub Pages solo sirve archivos estáticos, así que el backend
(login, base de datos y la API key de la IA) vive aparte y el frontend lo consume por `fetch`
con CORS limitado a `ALLOWED_ORIGINS`. La API key nunca llega al navegador.

## Correr en local

```bash
cd backend  && cp .env.example .env && npm run dev          # API en :3001 (npm test para las pruebas)
cd frontend && cp .env.example .env && npm install && npm run dev   # sitio en :5173
```
Si no defines `ADMIN_PASSWORD`, el backend genera una y la muestra en la consola.

## Publicar

1. **Backend en Render:** New → Blueprint con este repo (usa `render.yaml`) o Web Service manual
   (root `backend`, start `npm start`). Variables: `ALLOWED_ORIGINS=https://TU_USUARIO.github.io`,
   `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `ANTHROPIC_API_KEY`.
   Disco persistente en `/data` con `DB_PATH=/data/motolux.db`.
2. **Frontend:** GitHub → Settings → Pages → Source: **GitHub Actions**. En Settings → Secrets and
   variables → Actions → **Variables** crea `VITE_API_URL` con la URL del backend (sin `/` final).
3. Haz push a `main`: el workflow publica el sitio. Verifica que `…/api/health` responda `{"ok":true}`.

## Seguridad
Credenciales solo por variables de entorno · token firmado con expiración · rate limit en login,
contacto y chat · validación en servidor · CORS restringido · el servidor no arranca en producción si faltan variables.
