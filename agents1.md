# Agent 1 - Foundation And Platform

## Mission
Siapkan pondasi monorepo dan developer workflow supaya feature berikutnya bisa dibangun tanpa refactor besar.

## Dependencies
- none

## Subtasks
- buat struktur workspace `apps/web`, `apps/api`, `packages/shared`, `packages/ai`
- setup package manager workspace dan alias import
- setup React + Vite di `apps/web`
- setup Hono di `apps/api`
- setup TypeScript config root dan per package
- setup shared schema package berbasis Zod
- setup lint, format, typecheck, build script
- setup env validation untuk web dan api
- setup Drizzle config dan koneksi database
- setup Better Auth base integration
- setup logging util dan error response shape

## Deliverables
- monorepo jalan
- frontend dan backend bisa start
- shared package bisa diimport dari dua app
- command dev standar terdokumentasi

## Done Criteria
- `web`, `api`, `shared`, dan `ai` saling terhubung
- typecheck dan build dasar lolos
