import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import { env } from './config/env.js'
import masterRouter from './routes/index.js'
import { errorHandler } from './middlewares/error.middleware.js'
import { standardLimiter } from './middlewares/rateLimit.middleware.js'

const app = express()

// Security HTTP headers
app.use(helmet({
  contentSecurityPolicy: false, // Permit Swagger UI
  crossOriginEmbedderPolicy: false
}))

// Cross-Origin Resource Sharing
app.use(cors({
  origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-email', 'x-user-role', 'X-User-Email', 'X-User-Role']
}))

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
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'clinic-api',
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
