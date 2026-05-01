import { pgTable, uuid, text, timestamp, integer, bigint, jsonb, pgEnum, index } from 'drizzle-orm/pg-core'
import { user } from './auth-schema.js'

export const paperStatusEnum = pgEnum('paper_status', [
  'uploaded',
  'queued',
  'extracting',
  'summarizing',
  'completed',
  'failed',
])

export const jobStatusEnum = pgEnum('job_status', ['pending', 'processing', 'completed', 'failed'])

export const jobTypeEnum = pgEnum('job_type', ['analyze_paper', 'reanalyze_paper'])

export const chunkSourceTypeEnum = pgEnum('chunk_source_type', ['page', 'section', 'paragraph'])

export const insightConfidenceEnum = pgEnum('insight_confidence', ['low', 'medium', 'high'])

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  owner_id: text('owner_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('active'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ownerIdx: index('owner_idx').on(table.owner_id),
  ownerCreatedIdx: index('owner_created_idx').on(table.owner_id, table.created_at),
}))

export const papers = pgTable('papers', {
  id: uuid('id').primaryKey().defaultRandom(),
  project_id: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  uploaded_by: text('uploaded_by').notNull(),
  title: text('title'),
  original_filename: text('original_filename').notNull(),
  storage_bucket: text('storage_bucket').notNull().default('papers'),
  storage_path: text('storage_path').notNull(),
  mime_type: text('mime_type').notNull(),
  file_size_bytes: bigint('file_size_bytes', { mode: 'number' }).notNull(),
  checksum_sha256: text('checksum_sha256'),
  total_pages: integer('total_pages'),
  status: paperStatusEnum('status').notNull().default('uploaded'),
  last_error: text('last_error'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const analysisJobs = pgTable('analysis_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  paper_id: uuid('paper_id').notNull().references(() => papers.id, { onDelete: 'cascade' }),
  project_id: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  triggered_by: text('triggered_by').notNull(),
  job_type: jobTypeEnum('job_type').notNull(),
  status: jobStatusEnum('status').notNull().default('pending'),
  current_step: text('current_step'),
  retry_count: integer('retry_count').notNull().default(0),
  last_error: text('last_error'),
  model_provider: text('model_provider'),
  model_name: text('model_name'),
  prompt_version: text('prompt_version'),
  schema_version: text('schema_version'),
  input_token_count: integer('input_token_count'),
  output_token_count: integer('output_token_count'),
  cost_estimate_usd: text('cost_estimate_usd'),
  started_at: timestamp('started_at', { withTimezone: true }),
  completed_at: timestamp('completed_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const paperChunks = pgTable('paper_chunks', {
  id: uuid('id').primaryKey().defaultRandom(),
  paper_id: uuid('paper_id').notNull().references(() => papers.id, { onDelete: 'cascade' }),
  project_id: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  chunk_index: integer('chunk_index').notNull(),
  page_start: integer('page_start').notNull(),
  page_end: integer('page_end').notNull(),
  source_type: chunkSourceTypeEnum('source_type').notNull(),
  section_label: text('section_label'),
  content: text('content').notNull(),
  content_hash: text('content_hash'),
  char_count: integer('char_count').notNull(),
  token_estimate: integer('token_estimate'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const paperInsights = pgTable('paper_insights', {
  id: uuid('id').primaryKey().defaultRandom(),
  paper_id: uuid('paper_id').notNull().references(() => papers.id, { onDelete: 'cascade' }),
  project_id: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  analysis_job_id: uuid('analysis_job_id').notNull().references(() => analysisJobs.id, { onDelete: 'cascade' }),
  title: text('title'),
  authors: jsonb('authors'),
  publication_year: integer('publication_year'),
  research_problem: text('research_problem'),
  method: text('method'),
  dataset_or_object: text('dataset_or_object'),
  key_findings: jsonb('key_findings'),
  limitations: jsonb('limitations'),
  keywords: jsonb('keywords'),
  summary_markdown: text('summary_markdown'),
  prompt_version: text('prompt_version').notNull(),
  schema_version: text('schema_version').notNull(),
  model_provider: text('model_provider').notNull(),
  model_name: text('model_name').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const insightEvidence = pgTable('insight_evidence', {
  id: uuid('id').primaryKey().defaultRandom(),
  paper_insight_id: uuid('paper_insight_id').notNull().references(() => paperInsights.id, { onDelete: 'cascade' }),
  paper_id: uuid('paper_id').notNull().references(() => papers.id, { onDelete: 'cascade' }),
  chunk_id: uuid('chunk_id').notNull().references(() => paperChunks.id, { onDelete: 'cascade' }),
  insight_field: text('insight_field').notNull(),
  claim_label: text('claim_label'),
  quote: text('quote').notNull(),
  page: integer('page').notNull(),
  confidence: insightConfidenceEnum('confidence'),
  explanation: text('explanation'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
