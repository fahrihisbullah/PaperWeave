# PaperWeave Development Plan

## Product Goal

PaperWeave adalah workspace literature review yang membantu user:

- mengunggah paper PDF ke dalam satu project,
- mengekstrak isi paper menjadi insight terstruktur,
- menelusuri bukti untuk setiap klaim,
- membandingkan banyak paper,
- lalu menyusun draft literature review berbasis evidence.

## Product Promise

Fokus utama PaperWeave bukan sekadar "AI summary", tapi "AI-assisted literature review yang bisa ditelusuri balik ke sumber".

Artinya, sistem harus:

- evidence-first,
- async by default,
- aman untuk data user,
- mudah di-debug saat pipeline gagal,
- dan cukup hemat biaya untuk dipakai berulang.

## Core Tech Stack

### Frontend
- React + Vite
- TypeScript
- TanStack Query
- React Hook Form
- Zod
- Tailwind CSS + shadcn/ui

### Backend
- Hono
- TypeScript
- Zod
- Better Auth
- Drizzle ORM

### Database & Storage
- Supabase Postgres
- Supabase Storage
- pgvector

### AI Pipeline
- LLM provider abstraction: OpenAI / Gemini / Claude
- Structured output dengan Zod
- RAG berbasis paper chunks
- LangChain optional, bukan dependency wajib untuk MVP 1

---

## Delivery Principles

### 1. Evidence First
- Semua insight penting wajib punya evidence.
- Evidence minimal berisi `chunkId`, `page`, dan `quote`.
- Klaim tanpa evidence tidak boleh disimpan sebagai final result.

### 2. Async Pipeline
- Upload, extract, chunk, embedding, dan summarization harus dianggap background job.
- Frontend wajib punya status yang jelas: `pending`, `processing`, `completed`, `failed`.

### 3. Secure By Default
- Semua data user diproteksi oleh auth, ownership check, dan RLS.
- Storage path harus mengikuti scope user/project.
- Jangan pernah mengandalkan data client untuk authorization.

### 4. Observable And Retryable
- Simpan error reason, step terakhir, dan retry count.
- Setiap tahap pipeline harus idempotent jika di-run ulang.
- Admin/developer harus bisa tahu kegagalan terjadi di upload, extract, validate, atau LLM.

### 5. Versioned AI Output
- Simpan `promptVersion`, `schemaVersion`, dan `modelUsed`.
- Ini penting supaya hasil lama tetap bisa ditelusuri setelah prompt/schema berubah.

### 6. Cost-Aware
- Batasi ukuran file, jumlah chunk, dan token budget per job.
- Simpan usage metadata untuk evaluasi biaya.

---

## Suggested Core Data Model

### Identity And Ownership
- `users`
- `sessions`

### Workspace
- `projects`

### Papers And Analysis
- `papers`
- `analysis_jobs`
- `paper_chunks`
- `paper_insights`
- `insight_evidence`

### Multi-Paper Synthesis
- `paper_relations`
- `themes`
- `theme_papers`
- `review_drafts`

### Recommended Status Enums
- `paper_status`: `uploaded`, `queued`, `extracting`, `summarizing`, `completed`, `failed`
- `job_status`: `pending`, `processing`, `completed`, `failed`
- `draft_status`: `draft`, `ready`, `failed`

---

## Phase 0 - Foundation And Platform

### Goal
Menyiapkan monorepo, shared schema, auth boundary, database access, dan developer workflow.

### Tasks
- Setup monorepo structure:
  - `apps/web`
  - `apps/api`
  - `packages/shared`
  - `packages/ai`
- Setup React + Vite frontend
- Setup Hono backend
- Setup shared Zod schemas dan shared types
- Setup Drizzle ORM
- Setup Supabase connection
- Setup Better Auth
- Setup env validation
- Setup lint, format, typecheck, build, dan test scripts
- Setup basic logging dan error format

### Definition of Done
- Frontend jalan
- Backend jalan
- Database terkoneksi
- Auth basic tersedia
- Shared schema bisa dipakai frontend dan backend
- CI local commands jelas dan stabil

---

## Phase 1 - Auth And Project Workspace

### Goal
User bisa login dan mengelola project miliknya sendiri dengan aman.

### Tasks
- Implement login/register/logout
- Implement protected routes
- Create project list page
- Create project detail page
- Create API CRUD project
- Tambahkan ownership check di backend
- Tambahkan RLS policy untuk data workspace
- Buat empty state dan error state untuk project UI

### Tables
- `users`
- `sessions`
- `projects`

### Definition of Done
- User bisa login
- User bisa membuat project
- User bisa melihat daftar project miliknya
- User tidak bisa membuka project user lain

---

## Phase 2 - Paper Upload And Storage

### Goal
User bisa upload PDF ke dalam project dan metadata paper tersimpan rapi.

### Tasks
- Buat upload UI untuk single PDF
- Validasi tipe file dan ukuran file
- Simpan file ke Supabase Storage
- Simpan metadata paper ke database
- Tetapkan storage path convention per user/project/paper
- Simpan original filename, mime type, size, dan upload timestamp
- Tampilkan daftar paper dalam project

### Tables
- `papers`

### Definition of Done
- User bisa upload 1 PDF
- File tersimpan di storage
- Metadata paper tersimpan di database
- Paper muncul di project detail page

---

## Phase 3 - Analysis Pipeline V1

### Goal
Sistem bisa menjalankan pipeline analisis 1 paper secara async dari extract sampai summary tervalidasi.

### Tasks
- Buat `analysis_jobs`
- Buat trigger atau workflow untuk memulai analisis setelah upload
- Download/read PDF dari storage
- Extract text dari PDF
- Split text per page/chunk
- Simpan chunk ke database
- Setup provider abstraction di `packages/ai`
- Buat chain/service `summarizePaper`
- Gunakan structured output dengan Zod
- Validasi evidence untuk setiap insight penting
- Simpan summary, evidence, dan metadata model/prompt/schema version
- Simpan error detail jika job gagal

### Tables
- `analysis_jobs`
- `paper_chunks`
- `paper_insights`
- `insight_evidence`

### Minimal Structured Output
- title
- authors
- year
- researchProblem
- method
- datasetOrObject
- keyFindings
- limitations
- keywords
- evidence

### Definition of Done
- User upload 1 PDF
- Backend extract text
- Backend simpan chunk
- AI generate summary terstruktur
- Semua field penting tervalidasi Zod
- Evidence tersimpan dan bisa ditelusuri ke chunk
- Frontend menampilkan summary dan status analisis

---

## Phase 4 - Reliability And Processing UX

### Goal
Pipeline cukup stabil untuk dipakai berulang dan bisa dipantau user.

### Tasks
- Tampilkan status `pending`, `processing`, `completed`, `failed`
- Simpan retry count dan last error
- Tambahkan tombol re-run analysis
- Buat analyze endpoint idempotent
- Tambahkan logging per step pipeline
- Tambahkan token usage / cost metadata
- Tambahkan guardrail untuk max pages / max chunks / timeout
- Tambahkan failure state dan recovery UX di frontend

### Definition of Done
- User tahu paper sedang diproses atau gagal
- Paper gagal bisa di-run ulang
- Duplicate trigger tidak membuat data corrupt
- Dev bisa debug kegagalan dari logs dan job metadata

---

## Phase 5 - Multiple Papers In One Project

### Goal
User bisa upload dan memproses banyak paper dalam satu project.

### Tasks
- Support multiple PDF upload
- Queue multiple analysis jobs
- Tampilkan daftar paper dan processing status
- Tampilkan success/failure per paper
- Pastikan isolation antar paper dalam 1 project
- Optimasi query list papers + latest analysis state

### Definition of Done
- User bisa upload banyak PDF
- Setiap paper dianalisis terpisah
- Status tiap paper terlihat di frontend
- Kegagalan 1 paper tidak merusak paper lain

---

## Phase 6 - Cross-Paper Synthesis

### Goal
Sistem bisa menemukan hubungan dan pola antar paper dalam satu project.

### Tasks
- Compare insight antar paper
- Deteksi relasi:
  - `supports`
  - `contradicts`
  - `extends`
  - `similar_method`
  - `different_dataset`
- Simpan relasi ke database
- Generate theme clusters dari kumpulan paper
- Kelompokkan paper berdasarkan topik, metode, atau temuan
- Tambahkan research gap detection berbasis evidence

### Tables
- `paper_relations`
- `themes`
- `theme_papers`

### Definition of Done
- Sistem bisa membandingkan minimal 2 paper
- Relasi antar paper tersimpan
- Theme bisa dilihat user
- Research gap punya penjelasan yang bisa dilacak ke source insights

---

## Phase 7 - Literature Review Draft

### Goal
Sistem bisa menghasilkan draft literature review dari hasil synthesis project.

### Tasks
- Generate draft per theme
- Gunakan evidence dari paper insights
- Buat struktur draft:
  - introduction
  - theme discussion
  - comparison
  - research gap
  - conclusion
- Simpan draft ke database
- Support edit draft
- Support regenerate draft

### Tables
- `review_drafts`

### Definition of Done
- User bisa generate draft literature review
- Draft berdasarkan evidence
- Draft bisa diedit atau regenerate
- Draft tersimpan di project

---

## Phase 8 - Export And Visual Exploration

### Goal
User bisa membawa hasil keluar dari sistem dan mengeksplor relasi paper secara visual.

### Tasks
- Export summary ke Markdown
- Export literature review ke Markdown
- Optional: export DOCX
- Optional: export citation format APA/IEEE
- Buat graph view
- Node = paper
- Edge = relation
- Filter by theme
- Filter by relation type
- Klik node untuk buka summary

### Library Candidates
- React Flow
- Cytoscape.js

### Definition of Done
- User bisa download hasil review
- Hasil export rapi dan usable
- Graph tampil di frontend
- User bisa eksplor relasi paper dari graph

---

## MVP Roadmap

### MVP 1 - Single Paper Analysis
Flow:

```txt
Login
-> Create Project
-> Upload 1 PDF
-> Queue Analysis Job
-> Extract Text
-> Chunk Text
-> Generate Structured Summary
-> Validate Evidence
-> Save Result
-> Display Summary + Status
```

### MVP 2 - Multi-Paper Workspace
Flow:

```txt
Multiple PDFs
-> Batch Processing Status
-> Retry Failed Jobs
-> Compare Papers
```

### MVP 3 - Synthesis
Flow:

```txt
Theme Clustering
-> Paper Relations
-> Research Gap Detection
```

### MVP 4 - Drafting And Export
Flow:

```txt
Generate Literature Review Draft
-> Edit / Regenerate Draft
-> Export Markdown
-> Optional DOCX
```

### MVP 5 - Visual Graph
Flow:

```txt
Graph View
-> Relation Explorer
-> Advanced Filtering
```

---

## Explicit Non-Goals For MVP 1

- OCR untuk scanned PDF yang sangat buruk
- Citation style formatter yang lengkap
- Collaborative editing real-time
- Visual graph
- Full multi-model orchestration

## Success Criteria For MVP 1

- User bisa menyelesaikan flow upload sampai summary tanpa bantuan manual developer
- Summary punya evidence yang bisa dibuka user
- Failures bisa dilihat dan diulang
- Arsitektur cukup rapi untuk scale ke multi-paper synthesis
