import { config } from 'dotenv'
import { z } from 'zod'

config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  MONGO_URI: z.string().min(1, 'MONGO_URI manquant'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET doit être fourni'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET doit être fourni'),
  CRYPTO_KEY: z
    .string()
    .length(64, 'CRYPTO_KEY doit être une clé hex de 32 octets (64 chars)'),
  CLIENT_ORIGIN: z
    .string()
    .min(1, 'CLIENT_ORIGIN requis (ex: http://localhost:5173)')
    .transform((v) =>
      v
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    )
})

export const env = envSchema.parse(process.env)

