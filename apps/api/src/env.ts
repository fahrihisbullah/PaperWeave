import { config as loadEnv } from 'dotenv'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  aiEnvSchema,
  authEnvSchema,
  dbEnvSchema,
  envSchema,
  supabaseEnvSchema,
  validateEnv,
} from '@paperweave/shared'

const currentDir = dirname(fileURLToPath(import.meta.url))
loadEnv({ path: resolve(currentDir, '../.env') })

const apiEnvSchema = envSchema
  .merge(dbEnvSchema)
  .merge(supabaseEnvSchema)
  .merge(authEnvSchema)
  .merge(aiEnvSchema)

export const env = validateEnv(apiEnvSchema, process.env)
