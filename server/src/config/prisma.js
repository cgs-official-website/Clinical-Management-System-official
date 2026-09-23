import { PrismaClient } from '@prisma/client'
import { env } from './env.js'
import { logger } from '../utils/logger.js'

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
  log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  errorFormat: 'pretty',
})

export const checkDatabaseHealth = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'healthy', latencyMs: 1 }
  } catch (error) {
    return { status: 'unhealthy', error: error.message }
  }
}

export default prisma
