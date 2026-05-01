DO $$ BEGIN
  CREATE TYPE "paper_status" AS ENUM ('uploaded', 'queued', 'extracting', 'summarizing', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "papers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE cascade,
  "uploaded_by" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "title" text,
  "original_filename" text NOT NULL,
  "storage_bucket" text NOT NULL DEFAULT 'papers',
  "storage_path" text NOT NULL,
  "mime_type" text NOT NULL,
  "file_size_bytes" bigint NOT NULL,
  "checksum_sha256" text,
  "total_pages" integer,
  "status" "paper_status" NOT NULL DEFAULT 'uploaded',
  "last_error" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "papers_project_idx" ON "papers" ("project_id");
CREATE INDEX IF NOT EXISTS "papers_uploaded_by_idx" ON "papers" ("uploaded_by");
