DO $$ BEGIN
  CREATE TYPE "relation_type" AS ENUM ('supports', 'contradicts', 'extends', 'uses_method_of', 'shares_dataset', 'cites', 'related');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "paper_relations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE cascade,
  "source_paper_id" uuid NOT NULL REFERENCES "papers"("id") ON DELETE cascade,
  "target_paper_id" uuid NOT NULL REFERENCES "papers"("id") ON DELETE cascade,
  "relation_type" "relation_type" NOT NULL,
  "description" text,
  "confidence" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "themes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE cascade,
  "title" text NOT NULL,
  "description" text,
  "keywords" jsonb,
  "research_gaps" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "theme_papers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "theme_id" uuid NOT NULL REFERENCES "themes"("id") ON DELETE cascade,
  "paper_id" uuid NOT NULL REFERENCES "papers"("id") ON DELETE cascade,
  "relevance_note" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "review_drafts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE cascade,
  "title" text NOT NULL,
  "content_markdown" text NOT NULL,
  "structure" jsonb,
  "model_provider" text,
  "model_name" text,
  "prompt_version" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "paper_relations_project_idx" ON "paper_relations" ("project_id");
CREATE INDEX IF NOT EXISTS "paper_relations_source_idx" ON "paper_relations" ("source_paper_id");
CREATE INDEX IF NOT EXISTS "paper_relations_target_idx" ON "paper_relations" ("target_paper_id");
CREATE INDEX IF NOT EXISTS "themes_project_idx" ON "themes" ("project_id");
CREATE INDEX IF NOT EXISTS "theme_papers_theme_idx" ON "theme_papers" ("theme_id");
CREATE INDEX IF NOT EXISTS "theme_papers_paper_idx" ON "theme_papers" ("paper_id");
CREATE INDEX IF NOT EXISTS "review_drafts_project_idx" ON "review_drafts" ("project_id");
