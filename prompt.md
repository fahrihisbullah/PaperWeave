# Prompt For Fixing Remaining PW-001 To PW-020 Runtime Blocker

Tolong lanjutkan debugging dan perbaikan project `PaperWeave` di workspace ini.

## Context

PW-001 sampai PW-020 secara codebase sudah banyak dibenerin, dan status terakhirnya:

- `pnpm lint` lolos
- `pnpm typecheck` lolos
- `pnpm build` lolos
- API server sudah bisa listen di port `3000`
- `GET /api/health` sudah `200 OK`
- `GET /api/projects` tanpa auth sudah benar `401 Unauthorized`
- `GET /api/auth/get-session` tanpa cookie sudah benar `null`

Tetapi flow auth + project runtime belum lolos end-to-end.

## Current Runtime Failure

Saat dites dengan server lokal:

1. `POST /api/auth/sign-up/email` masih `500 Internal Server Error`
2. `GET /api/auth/get-session` setelah signup tetap `null`
3. `POST /api/projects` tetap `401 Unauthorized`
4. `GET /api/projects` tetap `401 Unauthorized`

## Important Finding Already Confirmed

Database credential sekarang sudah kebaca, tetapi database target kosong.

Sudah dicek dengan query ke `information_schema.tables` dan hasilnya `[]`.

Artinya tabel berikut belum ada di DB target:

- `user`
- `session`
- `account`
- `verification`
- `projects`

Kemungkinan terbesar penyebab `500` di signup adalah schema/migration belum diterapkan ke database.

## Files Already Relevant

- `apps/api/src/index.ts`
- `apps/api/src/env.ts`
- `apps/api/src/db/index.ts`
- `apps/api/src/db/auth-schema.ts`
- `apps/api/src/db/schema.ts`
- `apps/api/src/routes/projects.ts`
- `apps/api/drizzle/0000_auth_and_projects.sql`
- `apps/api/drizzle/meta/_journal.json`
- `apps/api/drizzle.config.ts`
- `apps/api/.env`

## Your Task

Tolong kerjakan hal-hal berikut:

### 1. Verify migration workflow actually works

- cek apakah `pnpm --filter @paperweave/api db:migrate` benar memakai config dan env yang sesuai
- cek apakah `drizzle-kit migrate` memang membaca file di `apps/api/drizzle/`
- kalau workflow migrate saat ini salah atau tidak kompatibel, perbaiki

### 2. Apply schema to target database

- pastikan tabel auth dan `projects` benar-benar dibuat di database target
- kalau perlu, rapikan migration SQL supaya kompatibel dengan Postgres/Supabase target
- pastikan extension/function yang dibutuhkan tersedia, misalnya jika `gen_random_uuid()` dipakai

### 3. Re-test full runtime flow

Setelah migration berhasil, jalankan ulang smoke test berikut:

- `GET /api/health`
- `POST /api/auth/sign-up/email`
- `GET /api/auth/get-session`
- `POST /api/projects`
- `GET /api/projects`
- `GET /api/projects/:id` untuk project yang baru dibuat

### 4. Fix any remaining auth/runtime issue

Kalau setelah migration signup masih `500`, lanjutkan debugging sampai ketemu akar masalah dan perbaiki.

Kemungkinan area masalah:

- Better Auth table compatibility
- Drizzle adapter schema mismatch
- cookie/session handling
- route wiring `auth.handler(...)`
- DB privileges / RLS interaction
- env mismatch (`PORT` vs `API_PORT`, dll)

## Constraints

- jangan ubah git history
- jangan pakai destructive git commands
- jangan hapus perubahan user yang tidak relevan
- fokus menyelesaikan runtime blocker sampai auth + project flow benar-benar hidup

## Definition of Done

Task dianggap selesai kalau semua ini terbukti:

- signup berhasil tanpa `500`
- session bisa terbentuk
- create project berhasil saat authenticated
- list project hanya menampilkan project milik user login
- detail project bisa dibuka untuk owner
- `pnpm lint`, `pnpm typecheck`, dan `pnpm build` tetap lolos

## Expected Output

Saat selesai, tolong laporkan:

1. akar masalah final
2. file apa saja yang diubah
3. command apa saja yang dijalankan
4. hasil akhir smoke test endpoint
5. apakah PW-001 sampai PW-020 sekarang benar-benar runtime-complete atau belum
