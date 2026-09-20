import { logger } from '../utils/logger.js'

export const errorHandler = (err, req, res, next) => {
  logger.error(`[API Error] ${req.method} ${req.originalUrl} - ${err.message}`, {
    stack: err.stack,
    name: err.name,
    code: err.code
  })

  // Known AppError subclasses
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code || 'APP_ERROR',
        message: err.message,
        details: err.details || null
      }
    })
  }

  // Prisma unique constraint violation (P2002)
  if (err.code === 'P2002') {
    const fields = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : (err.meta?.target || '')
    const target = fields ? ` (${fields})` : ''
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: `A record with this unique value already exists${target}. Please use a different value.`
      }
    })
  }

  // Prisma database connection errors (P1000, P1001, P1002, P1003, or connection failure)
  if (
    err.code === 'P1000' ||
    err.code === 'P1001' ||
    err.code === 'P1002' ||
    err.code === 'P1003' ||
    (typeof err.message === 'string' && (
      err.message.includes("Can't reach database server") ||
      err.message.includes('ECONNREFUSED') ||
      err.message.includes('ETIMEDOUT')
    ))
  ) {
    return res.status(503).json({
      success: false,
      error: {
        code: 'DATABASE_CONNECTION_ERROR',
        message: 'Database connection failed: Cannot reach the database server. Please verify database connectivity and credentials.'
      }
    })
  }

  // Prisma record not found (P2025)
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource does not exist'
      }
    })
  }

  // Fallback for unhandled unexpected errors
  const isProd = process.env.NODE_ENV === 'production'
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isProd ? 'An internal server error occurred' : err.message,
      ...(isProd ? {} : { stack: err.stack })
    }
  })
}
