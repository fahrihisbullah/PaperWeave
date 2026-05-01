CREATE TABLE IF NOT EXISTS "user" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text,
  "email" text NOT NULL UNIQUE,
  "email_verified" boolean NOT NULL DEFAULT false,
  "image" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" text PRIMARY KEY NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "token" text NOT NULL UNIQUE,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "ip_address" text,
  "user_agent" text,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS "account" (
  "id" text PRIMARY KEY NOT NULL,
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "access_token" text,
  "refresh_token" text,
  "id_token" text,
  "access_token_expires_at" timestamptz,
  "refresh_token_expires_at" timestamptz,
  "scope" text,
  "password" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "verification" (
  "id" text PRIMARY KEY NOT NULL,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "projects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "title" text NOT NULL,
  "description" text,
  "status" text NOT NULL DEFAULT 'active',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "owner_idx" ON "projects" ("owner_id");
CREATE INDEX IF NOT EXISTS "owner_created_idx" ON "projects" ("owner_id", "created_at");

ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_select_own" ON "projects";
CREATE POLICY "projects_select_own"
ON "projects"
FOR SELECT
USING ("owner_id" = current_setting('app.current_user_id', true));

DROP POLICY IF EXISTS "projects_insert_own" ON "projects";
CREATE POLICY "projects_insert_own"
ON "projects"
FOR INSERT
WITH CHECK ("owner_id" = current_setting('app.current_user_id', true));

DROP POLICY IF EXISTS "projects_update_own" ON "projects";
CREATE POLICY "projects_update_own"
ON "projects"
FOR UPDATE
USING ("owner_id" = current_setting('app.current_user_id', true))
WITH CHECK ("owner_id" = current_setting('app.current_user_id', true));

DROP POLICY IF EXISTS "projects_delete_own" ON "projects";
CREATE POLICY "projects_delete_own"
ON "projects"
FOR DELETE
USING ("owner_id" = current_setting('app.current_user_id', true));
