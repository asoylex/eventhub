import 'dotenv/config'
import './config/env' // Valida env vars al arrancar
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

import authRouter from './modules/auth/auth.router'
import catalogRouter from './modules/catalog/catalog.router'
import eventRouter from './modules/events/event.router'
import registrationRouter from './modules/registrations/registration.router'

import { errorHandler } from './middlewares/errorHandler'
import { logger } from './utils/logger'
import { env } from './config/env'

const app = express()

// ── Seguridad ────────────────────────────────────────────────────────────────
app.use(helmet())
app.use(
  cors({
    origin:
      env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL || ''
        : 'http://localhost:3000',
    credentials: true,
  })
)

// ── Rate limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: { success: false, message: 'Too many requests, slow down.' },
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // más estricto para auth
  message: { success: false, message: 'Too many login attempts.' },
})

app.use(limiter)

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_, res) => {
  res.json({ success: true, message: 'EventHub API running', env: env.NODE_ENV })
})

// ── Rutas ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRouter)
app.use('/api/catalog', catalogRouter)
app.use('/api/events', eventRouter)
app.use('/api/registrations', registrationRouter)

// ── 404 ──────────────────────────────────────────────────────────────────────
app.use((_, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

// ── Error handler (siempre al final) ─────────────────────────────────────────
app.use(errorHandler)

// ── Arrancar servidor ─────────────────────────────────────────────────────────
app.listen(env.PORT, () => {
  logger.info(`🚀 EventHub API running on http://localhost:${env.PORT}`)
  logger.info(`📦 Environment: ${env.NODE_ENV}`)
})

export default app