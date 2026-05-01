DO $$ BEGIN
  CREATE TYPE "job_status" AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "job_type" AS ENUM ('analyze_paper', 'reanalyze_paper');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "chunk_source_type" AS ENUM ('page', 'section', 'paragraph');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "analysis_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "paper_id" uuid NOT NULL REFERENCES "papers"("id") ON DELETE cascade,
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE cascade,
  "triggered_by" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "job_type" "job_type" NOT NULL,
  "status" "job_status" NOT NULL DEFAULT 'pending',
  "current_step" text,
  "retry_count" integer NOT NULL DEFAULT 0,
  "last_error" text,
  "model_provider" text,
  "model_name" text,
  "prompt_version" text,
  "schema_version" text,
  "input_token_count" integer,
  "output_token_count" integer,
  "cost_estimate_usd" text,
  "started_at" timestamptz,
  "completed_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "paper_chunks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "paper_id" uuid NOT NULL REFERENCES "papers"("id") ON DELETE cascade,
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE cascade,
  "chunk_index" integer NOT NULL,
  "page_start" integer NOT NULL,
  "page_end" integer NOT NULL,
  "source_type" "chunk_source_type" NOT NULL,
  "section_label" text,
  "content" text NOT NULL,
  "content_hash" text,
  "char_count" integer NOT NULL,
  "token_estimate" integer,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "analysis_jobs_paper_idx" ON "analysis_jobs" ("paper_id");
CREATE INDEX IF NOT EXISTS "analysis_jobs_project_idx" ON "analysis_jobs" ("project_id");
CREATE INDEX IF NOT EXISTS "analysis_jobs_status_idx" ON "analysis_jobs" ("status");
CREATE INDEX IF NOT EXISTS "paper_chunks_paper_idx" ON "paper_chunks" ("paper_id");
CREATE INDEX IF NOT EXISTS "paper_chunks_project_idx" ON "paper_chunks" ("project_id");
