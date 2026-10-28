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
  const start = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'healthy', latencyMs: Math.max(1, Date.now() - start) }
  } catch (error) {
    return { status: 'down', latencyMs: Math.max(1, Date.now() - start), error: error.message }
  }
}

export default prisma
