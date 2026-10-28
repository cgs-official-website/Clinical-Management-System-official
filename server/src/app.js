import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import { env } from './config/env.js'
import masterRouter from './routes/index.js'
import { errorHandler } from './middlewares/error.middleware.js'
import { standardLimiter } from './middlewares/rateLimit.middleware.js'
import { prisma } from './config/prisma.js'

const app = express()

// Security HTTP headers
app.use(helmet({
  contentSecurityPolicy: false, // Permit Swagger UI
  crossOriginEmbedderPolicy: false
}))

// Cross-Origin Resource Sharing
const configuredOrigins = env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(',').map((o) => o.trim())

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true)

    if (configuredOrigins === '*') return callback(null, true)

    // Allow any localhost / 127.0.0.1 port for local development (5173, 5174, 3000, etc.)
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true)
    }

    if (configuredOrigins.includes(origin)) {
      return callback(null, true)
    }

    callback(new Error(`Origin ${origin} not allowed by CORS policy`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-email', 'x-user-role', 'X-User-Email', 'X-User-Role']
}))
app.options('*', cors())

// Gzip Compression
app.use(compression())

// Body parsers
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Request Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan(':method :url :status :response-time ms - :res[content-length]'))
}

// Rate Limiting on API endpoints
app.use(env.API_PREFIX, standardLimiter)

// Root ping
app.get('/', (req, res) => {
  res.json({
    name: 'clinic OS Clinical Management System API',
    version: '1.0.0',
    documentation: `${env.API_PREFIX}/docs`,
    health: `${env.API_PREFIX}/health`
  })
})

// Cloud Healthcheck (Railway / container probes)
app.get('/health', async (req, res) => {
  let dbStatus = 'disconnected'
  let dbLatencyMs = null
  try {
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    dbLatencyMs = Date.now() - start
    dbStatus = 'connected'
  } catch (err) {
    dbStatus = 'error: ' + err.message
  }

  const isHealthy = dbStatus === 'connected'

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'clinic-api',
    database: {
      status: dbStatus,
      provider: 'PostgreSQL',
      latencyMs: dbLatencyMs,
    },
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  })
})

// Mount API Master Router
app.use(env.API_PREFIX, masterRouter)

// 404 Route Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`
    }
  })
})

// Centralized Error Handler
app.use(errorHandler)

export default app
