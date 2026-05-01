import { createClient } from '@supabase/supabase-js'
import { env } from '../env.js'

// Service role client for server-side operations (bypasses RLS)
export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_ANON_KEY,
  {
    auth: { persistSession: false },
  }
)

export const PAPERS_BUCKET = 'papers'
export const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
export const ALLOWED_MIME_TYPES = ['application/pdf']
