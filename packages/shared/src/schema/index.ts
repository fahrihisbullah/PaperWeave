import { z } from 'zod'

export const paperStatusEnum = z.enum([
  'uploaded',
  'queued',
  'extracting',
  'summarizing',
  'completed',
  'failed',
])
export type PaperStatus = z.infer<typeof paperStatusEnum>

export const jobStatusEnum = z.enum(['pending', 'processing', 'completed', 'failed'])
export type JobStatus = z.infer<typeof jobStatusEnum>

export const jobTypeEnum = z.enum(['analyze_paper', 'reanalyze_paper'])
export type JobType = z.infer<typeof jobTypeEnum>

export const chunkSourceTypeEnum = z.enum(['page', 'section', 'paragraph'])
export type ChunkSourceType = z.infer<typeof chunkSourceTypeEnum>

export const insightConfidenceEnum = z.enum(['low', 'medium', 'high'])
export type InsightConfidence = z.infer<typeof insightConfidenceEnum>

export const projectSchema = z.object({
  id: z.string().uuid(),
  owner_id: z.string(),
  title: z.string().min(1),
  description: z.string().nullable(),
  status: z.enum(['active', 'archived']).default('active'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})
export type Project = z.infer<typeof projectSchema>

export const paperSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  uploaded_by: z.string(),
  title: z.string().nullable(),
  original_filename: z.string(),
  storage_bucket: z.string(),
  storage_path: z.string(),
  mime_type: z.string(),
  file_size_bytes: z.number().positive(),
  checksum_sha256: z.string().nullable(),
  total_pages: z.number().int().positive().nullable(),
  status: paperStatusEnum,
  last_error: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})
export type Paper = z.infer<typeof paperSchema>

export const analysisJobSchema = z.object({
  id: z.string().uuid(),
  paper_id: z.string().uuid(),
  project_id: z.string().uuid(),
  triggered_by: z.string(),
  job_type: jobTypeEnum,
  status: jobStatusEnum,
  current_step: z.string().nullable(),
  retry_count: z.number().int().min(0).default(0),
  last_error: z.string().nullable(),
  model_provider: z.string().nullable(),
  model_name: z.string().nullable(),
  prompt_version: z.string().nullable(),
  schema_version: z.string().nullable(),
  input_token_count: z.number().int().nullable(),
  output_token_count: z.number().int().nullable(),
  cost_estimate_usd: z.number().positive().nullable(),
  started_at: z.string().datetime().nullable(),
  completed_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})
export type AnalysisJob = z.infer<typeof analysisJobSchema>

export const paperChunkSchema = z.object({
  id: z.string().uuid(),
  paper_id: z.string().uuid(),
  project_id: z.string().uuid(),
  chunk_index: z.number().int().min(0),
  page_start: z.number().int().positive(),
  page_end: z.number().int().positive(),
  source_type: chunkSourceTypeEnum,
  section_label: z.string().nullable(),
  content: z.string().min(1),
  content_hash: z.string().nullable(),
  char_count: z.number().int().positive(),
  token_estimate: z.number().int().nullable(),
  created_at: z.string().datetime(),
})
export type PaperChunk = z.infer<typeof paperChunkSchema>

export const paperInsightSchema = z.object({
  id: z.string().uuid(),
  paper_id: z.string().uuid(),
  project_id: z.string().uuid(),
  analysis_job_id: z.string().uuid(),
  title: z.string().nullable(),
  authors: z.array(z.string()).nullable(),
  publication_year: z.number().int().nullable(),
  research_problem: z.string().nullable(),
  method: z.string().nullable(),
  dataset_or_object: z.string().nullable(),
  key_findings: z.array(z.string()).nullable(),
  limitations: z.array(z.string()).nullable(),
  keywords: z.array(z.string()).nullable(),
  summary_markdown: z.string().nullable(),
  prompt_version: z.string(),
  schema_version: z.string(),
  model_provider: z.string(),
  model_name: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})
export type PaperInsight = z.infer<typeof paperInsightSchema>

export const insightEvidenceSchema = z.object({
  id: z.string().uuid(),
  paper_insight_id: z.string().uuid(),
  paper_id: z.string().uuid(),
  chunk_id: z.string().uuid(),
  insight_field: z.string(),
  claim_label: z.string().nullable(),
  quote: z.string().min(1),
  page: z.number().int().positive(),
  confidence: insightConfidenceEnum.nullable(),
  explanation: z.string().nullable(),
  created_at: z.string().datetime(),
})
export type InsightEvidence = z.infer<typeof insightEvidenceSchema>

export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.nullable(),
    error: z
      .object({
        code: z.string(),
        message: z.string(),
        details: z.unknown().optional(),
      })
      .nullable(),
    requestId: z.string(),
  })

export type ApiError = {
  code: string
  message: string
  details?: unknown
}

export type ApiResponse<T> = {
  success: boolean
  data: T | null
  error: ApiError | null
  requestId: string
}
