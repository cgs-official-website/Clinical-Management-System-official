import { PrismaClient } from '@prisma/client'
import { env } from './env.js'
import { logger } from '../utils/logger.js'

const globalForPrisma = globalThis

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  errorFormat: 'pretty',
})

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export const checkDatabaseHealth = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'healthy', latencyMs: 1 }
  } catch (error) {
    return { status: 'unhealthy', error: error.message }
  }
}

export default prisma
