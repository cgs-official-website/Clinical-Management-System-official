import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  PORT: z.union([z.string(), z.number()]).default('5001').transform((v) => (typeof v === 'number' ? v : parseInt(v, 10))),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().default('postgresql://postgres:password@localhost:5432/clinic_db?schema=public'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_ACCESS_SECRET: z.string().default('super-secret-access-token-key-clinical-os-2026'),
  JWT_REFRESH_SECRET: z.string().default('super-secret-refresh-token-key-clinical-os-2026'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('30d'),
  CORS_ORIGIN: z.string().default('*'),
  API_PREFIX: z.string().default('/api'),
  OPENROUTER_API_KEY: z.string().optional().default(''),
  OPENROUTER_MODEL: z.string().optional().default('openrouter/auto'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables configuration:', parsed.error.format())
  process.exit(1)
}

export const env = parsed.data
export default env
