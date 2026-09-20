import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

console.log('====================================================')
console.log('🏥  clinic OS — Cloud Deployment Initializer')
console.log('====================================================')

const port = process.env.PORT || 5000

console.log(`[Config] NODE_ENV: ${process.env.NODE_ENV || 'development'}`)
console.log(`[Config] Target PORT: ${port}`)
console.log(`[Config] DATABASE_URL: ${process.env.DATABASE_URL ? '[CONFIGURED]' : '[MISSING]'}`)
console.log(`[Config] REDIS_URL: ${process.env.REDIS_URL ? '[CONFIGURED]' : '[MISSING]'}`)

// 1. Synchronize Prisma Database Schema
if (process.env.DATABASE_URL) {
  try {
    console.log('\n📦 [Prisma] Synchronizing database schema via db push...')
    execSync('npx prisma db push --skip-generate --accept-data-loss', {
      cwd: rootDir,
      stdio: 'inherit',
      timeout: 45000,
      env: { ...process.env }
    })
    console.log('✅ [Prisma] Database schema synchronized successfully.')
  } catch (err) {
    console.warn('\n⚠️ [Prisma] Database schema push did not complete or timed out:', err.message)
    console.warn('⚠️ [Prisma] The application will continue booting. The database may still be initializing on Railway private network.')
  }
} else {
  console.warn('⚠️ [Prisma] DATABASE_URL is not set. Skipping schema sync.')
}

// 2. Launch Application Server
console.log('\n🚀 [Server] Launching Express & WebSocket server...')
try {
  await import('../src/server.js')
} catch (err) {
  console.error('❌ [Server] Fatal error during server startup:', err)
  process.exit(1)
}
