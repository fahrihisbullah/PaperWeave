import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema.js'
import * as authSchema from './auth-schema.js'
import * as synthesisSchema from './schema-synthesis.js'
import { env } from '../env.js'

const client = postgres(env.DATABASE_URL)
export const db = drizzle(client, { schema: { ...schema, ...authSchema, ...synthesisSchema } })

export type Database = typeof db
