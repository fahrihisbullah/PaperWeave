# PaperWeave Delivery Tickets

Dokumen ini menurunkan `agents1.md` sampai `agents10.md` menjadi issue/ticket kecil yang bisa langsung dipindah ke board.

Format singkat:

- `ID`
- `Title`
- `Depends on`
- `Acceptance`

---

## Agent 1 - Foundation And Platform

### PW-001 - Setup workspace root
- Depends on: none
- [x] Acceptance: monorepo bisa install dependency dari root dan semua package kebaca.

### PW-002 - Bootstrap `apps/web`
- Depends on: PW-001
- [x] Acceptance: app React + Vite jalan di local.

### PW-003 - Bootstrap `apps/api`
- Depends on: PW-001
- [x] Acceptance: server Hono jalan di local dengan health endpoint.

### PW-004 - Setup shared TypeScript config
- Depends on: PW-001
- [x] Acceptance: path alias dan TS references konsisten lintas app/package.

### PW-005 - Create `packages/shared`
- Depends on: PW-004
- [x] Acceptance: schema/type shared bisa diimport dari `web` dan `api`.

### PW-006 - Create `packages/ai`
- Depends on: PW-001
- [x] Acceptance: package AI punya entrypoint dan siap dipakai backend.

### PW-007 - Setup lint, format, and typecheck
- Depends on: PW-002, PW-003, PW-004
- [x] Acceptance: ada script root untuk lint, format check, dan typecheck.

### PW-008 - Setup env validation
- Depends on: PW-002, PW-003
- [x] Acceptance: env yang wajib tervalidasi saat startup.

### PW-009 - Setup Drizzle base config
- Depends on: PW-003, PW-008
- [x] Acceptance: API bisa connect ke database lewat Drizzle.

### PW-010 - Setup base logging and error response shape
- Depends on: PW-003
- [x] Acceptance: API punya format error konsisten dan logging dasar.

---

## Agent 2 - Auth And Project Workspace

### PW-011 - Integrate Better Auth base setup
- Depends on: PW-003, PW-008, PW-009
- [x] Acceptance: auth library terpasang dan route dasar aktif.

### PW-012 - Implement register/login/logout flow
- Depends on: PW-011
- [x] Acceptance: user bisa register, login, dan logout end-to-end.

### PW-013 - Add auth session handling in frontend
- Depends on: PW-012, PW-002
- [x] Acceptance: web bisa membaca status session dan menampilkan state sesuai auth.

### PW-014 - Protect app routes
- Depends on: PW-013
- [x] Acceptance: page private tidak bisa dibuka tanpa login.

### PW-015 - Create `projects` schema and migration
- Depends on: PW-009
- [x] Acceptance: tabel `projects` tersedia dengan relasi owner.

### PW-016 - Implement project create/list/detail API
- Depends on: PW-015, PW-012
- [x] Acceptance: endpoint create/list/detail project berjalan.

### PW-017 - Build project list page
- Depends on: PW-016
- [x] Acceptance: user bisa melihat daftar project miliknya.

### PW-018 - Build project creation flow
- Depends on: PW-016, PW-017
- [x] Acceptance: user bisa membuat project baru dari UI.

### PW-019 - Build project detail page shell
- Depends on: PW-016
- [x] Acceptance: detail project tampil dengan empty state yang jelas.

### PW-020 - Add ownership checks and RLS for projects
- Depends on: PW-015, PW-016
- [x] Acceptance: user tidak bisa membaca/menulis project milik user lain.

---

## Agent 3 - Paper Upload And Storage

### PW-021 - Create storage bucket strategy and naming convention
- Depends on: PW-019
- Acceptance: ada keputusan bucket + path format yang konsisten.

### PW-022 - Create `papers` schema and migration
- Depends on: PW-009, PW-015
- Acceptance: tabel `papers` tersedia.

### PW-023 - Build single PDF upload component
- Depends on: PW-019
- Acceptance: user bisa memilih file PDF dari project detail page.

### PW-024 - Add client-side validation for PDF and size limit
- Depends on: PW-023
- Acceptance: non-PDF dan file oversized ditolak di UI.

### PW-025 - Implement upload endpoint / handler
- Depends on: PW-021, PW-022, PW-023
- Acceptance: file PDF tersimpan ke storage dan metadata row dibuat.

### PW-026 - Persist upload metadata to database
- Depends on: PW-025
- Acceptance: `original_filename`, `storage_path`, `mime_type`, `size` tersimpan.

### PW-027 - Show paper list in project detail page
- Depends on: PW-026
- Acceptance: paper yang baru diupload langsung terlihat di daftar.

### PW-028 - Add upload error and success states
- Depends on: PW-025, PW-027
- Acceptance: user tahu saat upload sukses atau gagal.

---

## Agent 4 - Extraction And Chunking Pipeline

### PW-029 - Create `analysis_jobs` schema and migration
- Depends on: PW-022
- Acceptance: tabel `analysis_jobs` tersedia.

### PW-030 - Create `paper_chunks` schema and migration
- Depends on: PW-022
- Acceptance: tabel `paper_chunks` tersedia.

### PW-031 - Define paper/job status transitions
- Depends on: PW-029, PW-030
- Acceptance: ada state machine sederhana untuk paper dan job.

### PW-032 - Create analysis enqueue action after upload
- Depends on: PW-025, PW-029
- Acceptance: upload paper bisa membuat job `pending`.

### PW-033 - Implement storage file fetch in backend
- Depends on: PW-032
- Acceptance: API worker bisa mengambil file PDF dari storage.

### PW-034 - Implement PDF text extraction service
- Depends on: PW-033
- Acceptance: file PDF bisa diubah menjadi raw text per page.

### PW-035 - Implement chunking strategy
- Depends on: PW-034, PW-030
- Acceptance: text hasil extract dipecah jadi chunk terurut.

### PW-036 - Persist chunks with page metadata
- Depends on: PW-035
- Acceptance: chunk tersimpan lengkap dengan `page_start`, `page_end`, `chunk_index`.

### PW-037 - Update job and paper status through extraction flow
- Depends on: PW-031, PW-036
- Acceptance: status berubah sesuai step processing.

### PW-038 - Add extraction failure handling
- Depends on: PW-034, PW-037
- Acceptance: error extraction tersimpan di `last_error` dan UI bisa membaca status failed.

---

## Agent 5 - Structured Summary And Evidence Validation

### PW-039 - Setup provider abstraction in `packages/ai`
- Depends on: PW-006
- Acceptance: backend bisa memanggil provider AI lewat interface yang konsisten.

### PW-040 - Define Zod schema for `PaperInsight`
- Depends on: PW-005
- Acceptance: schema insight terstruktur tersedia dan reusable.

### PW-041 - Define Zod schema for `InsightEvidence`
- Depends on: PW-040
- Acceptance: schema evidence tersedia dan reusable.

### PW-042 - Create summary prompt v1
- Depends on: PW-039, PW-040, PW-041
- Acceptance: ada prompt yang meminta output terstruktur + evidence.

### PW-043 - Create `paper_insights` schema and migration
- Depends on: PW-029
- Acceptance: tabel `paper_insights` tersedia.

### PW-044 - Create `insight_evidence` schema and migration
- Depends on: PW-030, PW-043
- Acceptance: tabel `insight_evidence` tersedia.

### PW-045 - Implement summary generation from chunks
- Depends on: PW-042, PW-036, PW-043
- Acceptance: chunks bisa diproses menjadi summary terstruktur.

### PW-046 - Validate evidence against source chunk content
- Depends on: PW-041, PW-044, PW-045
- Acceptance: quote yang tidak ditemukan di chunk ditolak.

### PW-047 - Persist insight, evidence, and AI version metadata
- Depends on: PW-045, PW-046
- Acceptance: result final tersimpan lengkap dengan prompt/schema/model metadata.

### PW-048 - Build paper summary detail UI
- Depends on: PW-047
- Acceptance: user bisa baca summary dan evidence di frontend.

### PW-049 - Handle invalid AI output as failed job
- Depends on: PW-045, PW-046
- Acceptance: output AI yang invalid tidak masuk sebagai final result.

---

## Agent 6 - Reliability, Retry, And Observability

### PW-050 - Expose processing status in frontend
- Depends on: PW-037, PW-049
- Acceptance: user bisa melihat `pending`, `processing`, `completed`, `failed`.

### PW-051 - Add retry count and last error handling
- Depends on: PW-029, PW-049
- Acceptance: job menyimpan `retry_count` dan `last_error` dengan benar.

### PW-052 - Implement re-run analysis action
- Depends on: PW-051
- Acceptance: paper failed bisa dijalankan ulang dari UI atau endpoint.

### PW-053 - Make analysis endpoint idempotent
- Depends on: PW-032, PW-052
- Acceptance: trigger ganda tidak membuat duplicate final state.

### PW-054 - Capture token usage and cost estimate
- Depends on: PW-045
- Acceptance: metadata usage tersimpan per job.

### PW-055 - Add step-based logging for analysis flow
- Depends on: PW-010, PW-037, PW-045
- Acceptance: log memudahkan identifikasi step failure.

### PW-056 - Add processing guardrails
- Depends on: PW-034, PW-035, PW-045
- Acceptance: ada batas max pages, max chunks, dan timeout.

### PW-057 - Improve failed-state and retry UX
- Depends on: PW-050, PW-052
- Acceptance: user tahu cara recover dari failed state.

---

## Agent 7 - Multi-Paper Processing

### PW-058 - Extend upload UI for multiple PDF selection
- Depends on: PW-023
- Acceptance: user bisa pilih banyak file sekaligus.

### PW-059 - Create batch upload flow per project
- Depends on: PW-058, PW-025
- Acceptance: banyak file bisa diupload dalam satu aksi.

### PW-060 - Enqueue one analysis job per uploaded paper
- Depends on: PW-059, PW-032
- Acceptance: tiap paper punya job sendiri.

### PW-061 - Show per-paper processing state in list view
- Depends on: PW-060, PW-050
- Acceptance: daftar paper menampilkan status terbaru per row.

### PW-062 - Support partial success and partial failure UI
- Depends on: PW-061
- Acceptance: user tahu paper mana yang berhasil dan gagal.

### PW-063 - Optimize project paper list query
- Depends on: PW-061
- Acceptance: list papers + latest status bisa di-load efisien.

### PW-064 - Add bulk retry for failed papers
- Depends on: PW-052, PW-062
- Acceptance: user bisa retry beberapa paper sekaligus.

---

## Agent 8 - Cross-Paper Synthesis

### PW-065 - Create `paper_relations` schema and migration
- Depends on: PW-047
- Acceptance: tabel `paper_relations` tersedia.

### PW-066 - Create `themes` schema and migration
- Depends on: PW-047
- Acceptance: tabel `themes` tersedia.

### PW-067 - Create `theme_papers` schema and migration
- Depends on: PW-066, PW-022
- Acceptance: relasi paper ke theme tersedia.

### PW-068 - Implement pairwise paper comparison service
- Depends on: PW-047, PW-065
- Acceptance: minimal 2 paper bisa dibandingkan.

### PW-069 - Detect relation types between papers
- Depends on: PW-068
- Acceptance: relation type utama bisa dihasilkan dan disimpan.

### PW-070 - Generate theme clusters per project
- Depends on: PW-067, PW-068
- Acceptance: paper bisa dikelompokkan ke beberapa theme.

### PW-071 - Implement research gap detection
- Depends on: PW-068, PW-070
- Acceptance: project bisa menampilkan research gap summary.

### PW-072 - Build synthesis view in frontend
- Depends on: PW-069, PW-070, PW-071
- Acceptance: user bisa membaca relations, themes, dan gap dari UI.

---

## Agent 9 - Drafting And Export

### PW-073 - Create `review_drafts` schema and migration
- Depends on: PW-070, PW-071
- Acceptance: tabel `review_drafts` tersedia.

### PW-074 - Implement draft generation from synthesis data
- Depends on: PW-073
- Acceptance: draft literature review bisa dihasilkan.

### PW-075 - Create draft editor UI
- Depends on: PW-074
- Acceptance: user bisa edit isi draft dari frontend.

### PW-076 - Add regenerate draft action
- Depends on: PW-074
- Acceptance: user bisa regenerate draft tanpa kehilangan kontrol flow.

### PW-077 - Implement markdown export
- Depends on: PW-075
- Acceptance: draft bisa diunduh sebagai markdown.

### PW-078 - Implement optional DOCX export
- Depends on: PW-077
- Acceptance: DOCX export tersedia jika diputuskan masuk scope.

---

## Agent 10 - Visual Graph And Final Polish

### PW-079 - Choose graph library
- Depends on: PW-072
- Acceptance: ada keputusan final `React Flow` atau `Cytoscape.js`.

### PW-080 - Build graph data adapter from relations
- Depends on: PW-065, PW-079
- Acceptance: data relation bisa dipetakan jadi nodes dan edges.

### PW-081 - Implement graph view UI
- Depends on: PW-080
- Acceptance: graph paper tampil di frontend.

### PW-082 - Add graph filters for theme and relation type
- Depends on: PW-081
- Acceptance: user bisa filter tampilan graph.

### PW-083 - Add node detail side panel
- Depends on: PW-081
- Acceptance: klik node membuka context summary paper.

### PW-084 - Final UX polish for loading, empty, and error states
- Depends on: PW-083, PW-077
- Acceptance: flow utama terasa utuh dan konsisten.

---

## Suggested First Sprint Slice

Kalau mau langsung buka sprint pertama, ambil ticket ini dulu:

- PW-001 sampai PW-010
- PW-011 sampai PW-020
- PW-021 sampai PW-028
- PW-029 sampai PW-038
- PW-039 sampai PW-049

Itu sudah cukup untuk mendorong MVP 1 mendekati usable.
