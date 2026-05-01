# PaperWeave Implementation Order

Dokumen ini jawab pertanyaan: kalau mulai coding minggu ini, urutan teknis paling aman yang mana?

Fokusnya bukan urutan phase produk di atas kertas, tapi urutan kerja yang meminimalkan block, rework, dan integrasi yang berantakan.

---

## Main Strategy

Bangun vertical slice MVP 1 dulu sampai benar-benar hidup:

```txt
Auth
-> Project
-> Upload
-> Queue Job
-> Extract
-> Chunk
-> Summarize
-> Validate Evidence
-> Show Result
```

Jangan lompat ke clustering, graph, atau export sebelum slice ini stabil.

---

## Build Order

## Step 1 - Lock Foundations

Kerjakan lebih dulu:

- workspace monorepo
- `apps/web`, `apps/api`, `packages/shared`, `packages/ai`
- TypeScript base config
- lint, format, typecheck, build script
- env validation
- Drizzle connection
- basic logging

## Why

Kalau fondasi ini belum rapih, semua PR setelahnya akan lebih mahal direvisi.

## Output

- semua app bisa jalan
- root scripts stabil
- database connection ready

---

## Step 2 - Finish Auth Boundary Before Feature Work

Kerjakan:

- Better Auth integration
- session flow
- protected routes
- auth-aware API context

## Why

Project ownership, storage access, dan data reads semua bergantung ke identity layer.

## Output

- user bisa login/logout
- route private aman
- backend tahu current user

---

## Step 3 - Create Workspace Skeleton

Kerjakan:

- schema `projects`
- project CRUD API
- project list page
- project detail shell
- RLS dan ownership checks untuk project

## Why

Semua paper harus hidup di dalam project. Kalau project layer belum matang, upload akan cepat jadi berantakan.

## Output

- user punya workspace nyata untuk menampung paper

---

## Step 4 - Ship Single PDF Upload End-To-End

Kerjakan:

- schema `papers`
- bucket/path convention
- upload UI
- upload handler
- metadata persistence
- project detail page menampilkan daftar paper

## Why

Ini titik masuk semua data. Begitu upload stabil, pipeline AI bisa dibangun di atasnya.

## Output

- user bisa memasukkan 1 PDF ke project

---

## Step 5 - Add Async Analysis Job Layer

Kerjakan:

- schema `analysis_jobs`
- paper/job statuses
- enqueue flow setelah upload
- initial processing UI state

## Why

Jangan bikin extraction/summarization sebagai request sync biasa. Dari awal biasakan flow async.

## Output

- paper yang diupload langsung punya status analisis

---

## Step 6 - Implement Extraction And Chunking

Kerjakan:

- fetch PDF dari storage
- extract text
- schema `paper_chunks`
- chunking strategy
- save chunks
- update status jika gagal/sukses

## Why

Chunk adalah fondasi evidence dan future RAG. Ini harus stabil sebelum prompt AI dibangun.

## Output

- 1 paper bisa berubah jadi dataset chunk yang rapi

---

## Step 7 - Implement Structured Summary

Kerjakan:

- provider abstraction di `packages/ai`
- Zod schema insight dan evidence
- prompt v1
- schema `paper_insights`
- schema `insight_evidence`
- summary generation
- evidence validation
- persistence result

## Why

Ini baru titik di mana product promise PaperWeave mulai kelihatan.

## Output

- 1 paper punya summary terstruktur dengan evidence

---

## Step 8 - Build Readable Summary UX

Kerjakan:

- paper detail page
- summary sections
- evidence viewer
- status badge
- failed state
- retry action

## Why

Pipeline backend yang jalan tapi tidak kebaca user belum layak disebut MVP usable.

## Output

- user bisa benar-benar melihat hasil dan mengecek buktinya

---

## Step 9 - Harden Reliability

Kerjakan:

- idempotent analysis endpoint
- retry count dan last error
- guardrail max pages/max chunks/timeout
- token usage/cost metadata
- step-based logging

## Why

Sebelum scale ke multi-paper, lo harus yakin single-paper flow tahan gagal.

## Output

- MVP 1 siap dipakai lebih konsisten

---

## Step 10 - Only Then Move To MVP 2+

Baru setelah MVP 1 stabil, lanjutkan:

1. multi-PDF processing
2. compare papers
3. theme clustering
4. research gap detection
5. draft generation
6. export
7. graph visualization

---

## Recommended PR Sequence

Kalau mau lebih rapi di git, pecah jadi PR kecil begini:

1. monorepo + tooling baseline
2. auth integration + protected routes
3. projects schema + project pages
4. papers schema + upload flow
5. analysis jobs + processing state
6. extraction + chunking
7. AI provider abstraction + Zod schema
8. summary generation + evidence persistence
9. summary UI + retry UX
10. reliability hardening

---

## Suggested Team Split

Kalau dikerjakan paralel oleh beberapa agent/dev:

### Track A - App Shell
- frontend app shell
- auth UI
- project pages
- summary UI

### Track B - Backend Core
- auth integration
- project API
- upload handler
- analysis job orchestration

### Track C - AI Pipeline
- extraction
- chunking
- prompt design
- structured output
- evidence validation

### Track D - Data And Infra
- schema design
- migrations
- RLS
- storage policy
- observability metadata

Parallel work aman dimulai setelah Step 1 dan Step 2 cukup stabil.

---

## What Not To Do Too Early

- jangan mulai dari graph view
- jangan terlalu cepat masuk pgvector kalau summary single-paper belum stabil
- jangan over-engineer prompt orchestration di MVP 1
- jangan bikin export DOCX sebelum markdown export beres
- jangan nambah banyak model provider sebelum 1 provider benar-benar jalan

---

## Definition Of A Good Week 1

Week 1 dianggap sukses kalau di akhir minggu lo sudah punya:

- monorepo hidup
- auth hidup
- project CRUD hidup
- upload PDF hidup
- paper row tersimpan
- analysis job row tercipta setelah upload

Kalau itu sudah tercapai, minggu 2 bisa fokus extraction + chunking, dan minggu 3 fokus summary + evidence.
