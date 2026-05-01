import { z } from 'zod'

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_URL: z.string().url().default('http://localhost:3000'),
  API_PORT: z.string().default('3000'),
})

export const dbEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  DB_HOST: z.string().optional(),
  DB_PORT: z.string().optional(),
  DB_NAME: z.string().optional(),
})

export const supabaseEnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
})

export const authEnvSchema = z.object({
  AUTH_SECRET: z.string().min(32),
  AUTH_EXPIRES_IN: z.string().default('7d'),
  AUTH_REFRESH_IN: z.string().default('30d'),
})

export const aiEnvSchema = z.object({
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  AI_MODEL_PROVIDER: z.enum(['openai', 'anthropic', 'gemini']).default('openai'),
  AI_MODEL_NAME: z.string().default('gpt-4o-mini'),
})

export type Env = z.infer<typeof envSchema>
export type DbEnv = z.infer<typeof dbEnvSchema>
export type SupabaseEnv = z.infer<typeof supabaseEnvSchema>
export type AuthEnv = z.infer<typeof authEnvSchema>
export type AiEnv = z.infer<typeof aiEnvSchema>

export function validateEnv<T extends z.ZodTypeAny>(
  schema: T,
  env: Record<string, unknown>
): z.infer<T> {
  const result = schema.safeParse(env)
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`)
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`)
  }
  return result.data
}