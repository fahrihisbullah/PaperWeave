DO $$ BEGIN
  CREATE TYPE "insight_confidence" AS ENUM ('low', 'medium', 'high');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "paper_insights" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "paper_id" uuid NOT NULL REFERENCES "papers"("id") ON DELETE cascade,
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE cascade,
  "analysis_job_id" uuid NOT NULL REFERENCES "analysis_jobs"("id") ON DELETE cascade,
  "title" text,
  "authors" jsonb,
  "publication_year" integer,
  "research_problem" text,
  "method" text,
  "dataset_or_object" text,
  "key_findings" jsonb,
  "limitations" jsonb,
  "keywords" jsonb,
  "summary_markdown" text,
  "prompt_version" text NOT NULL,
  "schema_version" text NOT NULL,
  "model_provider" text NOT NULL,
  "model_name" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "insight_evidence" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "paper_insight_id" uuid NOT NULL REFERENCES "paper_insights"("id") ON DELETE cascade,
  "paper_id" uuid NOT NULL REFERENCES "papers"("id") ON DELETE cascade,
  "chunk_id" uuid NOT NULL REFERENCES "paper_chunks"("id") ON DELETE cascade,
  "insight_field" text NOT NULL,
  "claim_label" text,
  "quote" text NOT NULL,
  "page" integer NOT NULL,
  "confidence" "insight_confidence",
  "explanation" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "paper_insights_paper_idx" ON "paper_insights" ("paper_id");
CREATE INDEX IF NOT EXISTS "paper_insights_job_idx" ON "paper_insights" ("analysis_job_id");
CREATE INDEX IF NOT EXISTS "insight_evidence_insight_idx" ON "insight_evidence" ("paper_insight_id");
CREATE INDEX IF NOT EXISTS "insight_evidence_chunk_idx" ON "insight_evidence" ("chunk_id");
