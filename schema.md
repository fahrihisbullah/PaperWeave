# PaperWeave MVP 1 Schema

## Scope

Schema ini fokus untuk MVP 1:

- auth dan ownership,
- project workspace,
- single PDF upload,
- background analysis job,
- extraction dan chunking,
- structured summary dengan evidence.

Tujuannya bukan bikin schema final semua phase, tapi bikin fondasi yang cukup aman dan stabil untuk lanjut ke MVP 2 tanpa refactor besar.

---

## Design Principles

- pisahkan data workspace dari data auth
- semua entity utama punya `id`, `created_at`, `updated_at`
- semua relasi penting pakai foreign key
- semua hasil AI yang penting punya version metadata
- semua proses async punya status yang jelas
- evidence harus bisa ditelusuri balik ke chunk sumber

---

## Recommended Enums

### `paper_status`

- `uploaded`
- `queued`
- `extracting`
- `summarizing`
- `completed`
- `failed`

### `job_status`

- `pending`
- `processing`
- `completed`
- `failed`

### `job_type`

- `analyze_paper`
- `reanalyze_paper`

### `chunk_source_type`

- `page`
- `section`
- `paragraph`

### `insight_confidence`

- `low`
- `medium`
- `high`

---

## Entity Relationship Overview

```txt
user
-> projects
-> papers
-> analysis_jobs
-> paper_chunks
-> paper_insights
-> insight_evidence
```

Lebih detail:

```txt
user 1---N projects
project 1---N papers
paper 1---N analysis_jobs
paper 1---N paper_chunks
paper 1---N paper_insights
paper_insights 1---N insight_evidence
insight_evidence N---1 paper_chunks
```

---

## Auth Tables

## Recommendation

Karena stack-nya pakai Better Auth + Supabase Postgres, tabel auth sebaiknya mengikuti adapter Better Auth yang dipakai di implementasi nyata.

Secara logical, PaperWeave butuh:

- `users`
- `sessions`
- `accounts` jika login provider eksternal dipakai
- `verifications` jika email verification / reset flow dipakai

## Practical Note

Kalau Better Auth adapter menghasilkan nama tabel seperti `user`, `session`, `account`, `verification`, ikuti naming bawaan adapter supaya integrasi lebih gampang.

Di dokumen ini, relasi app-level akan mengacu ke logical user record sebagai `users.id`.

---

## Table: `projects`

## Purpose

Mewadahi satu workspace literature review milik satu user.

## Columns

| column | type | required | notes |
|---|---|---:|---|
| `id` | `uuid` | yes | primary key |
| `owner_id` | `text` or `uuid` | yes | foreign key ke auth user table |
| `title` | `text` | yes | nama project |
| `description` | `text` | no | deskripsi singkat project |
| `status` | `text` | yes | default `active` |
| `created_at` | `timestamptz` | yes | default `now()` |
| `updated_at` | `timestamptz` | yes | default `now()` |

## Indexes

- index on `owner_id`
- index on `(owner_id, created_at desc)`

## Constraints

- `title` tidak boleh kosong
- `status` sementara cukup `active` atau `archived`

---

## Table: `papers`

## Purpose

Menyimpan metadata file PDF yang diupload ke dalam project.

## Columns

| column | type | required | notes |
|---|---|---:|---|
| `id` | `uuid` | yes | primary key |
| `project_id` | `uuid` | yes | foreign key ke `projects.id` |
| `uploaded_by` | `text` or `uuid` | yes | user yang upload |
| `title` | `text` | no | bisa diisi dari metadata PDF atau hasil extraction |
| `original_filename` | `text` | yes | nama file asli |
| `storage_bucket` | `text` | yes | mis. `papers` |
| `storage_path` | `text` | yes | path object di storage |
| `mime_type` | `text` | yes | harus `application/pdf` |
| `file_size_bytes` | `bigint` | yes | ukuran file |
| `checksum_sha256` | `text` | no | dedupe/debug optional tapi direkomendasikan |
| `total_pages` | `integer` | no | diisi setelah extraction |
| `status` | `paper_status` | yes | default `uploaded` |
| `last_error` | `text` | no | error terakhir yang relevan |
| `created_at` | `timestamptz` | yes | default `now()` |
| `updated_at` | `timestamptz` | yes | default `now()` |

## Indexes

- index on `project_id`
- index on `(project_id, created_at desc)`
- index on `status`
- unique index on `storage_path`

## Constraints

- `file_size_bytes > 0`
- `mime_type = 'application/pdf'`

---

## Table: `analysis_jobs`

## Purpose

Menyimpan lifecycle background processing untuk paper analysis.

## Columns

| column | type | required | notes |
|---|---|---:|---|
| `id` | `uuid` | yes | primary key |
| `paper_id` | `uuid` | yes | foreign key ke `papers.id` |
| `project_id` | `uuid` | yes | denormalized untuk query cepat |
| `triggered_by` | `text` or `uuid` | yes | user/system yang memicu job |
| `job_type` | `job_type` | yes | `analyze_paper` / `reanalyze_paper` |
| `status` | `job_status` | yes | default `pending` |
| `current_step` | `text` | no | mis. `extract_text`, `chunk_text`, `generate_summary` |
| `retry_count` | `integer` | yes | default `0` |
| `last_error` | `text` | no | error terakhir |
| `model_provider` | `text` | no | mis. `openai`, `gemini` |
| `model_name` | `text` | no | model final yang dipakai |
| `prompt_version` | `text` | no | versi prompt |
| `schema_version` | `text` | no | versi output schema |
| `input_token_count` | `integer` | no | optional untuk observability |
| `output_token_count` | `integer` | no | optional untuk observability |
| `cost_estimate_usd` | `numeric(10,4)` | no | optional |
| `started_at` | `timestamptz` | no | saat proses mulai |
| `completed_at` | `timestamptz` | no | saat proses selesai |
| `created_at` | `timestamptz` | yes | default `now()` |
| `updated_at` | `timestamptz` | yes | default `now()` |

## Indexes

- index on `paper_id`
- index on `project_id`
- index on `status`
- index on `(paper_id, created_at desc)`

## Constraints

- `retry_count >= 0`
- `cost_estimate_usd >= 0` jika diisi

## Notes

- tabel ini penting untuk retry, observability, dan progress UI
- untuk MVP 1 cukup 1 active job per paper, tapi history job tetap disimpan

---

## Table: `paper_chunks`

## Purpose

Menyimpan hasil text extraction yang dipecah jadi unit kecil untuk analisis dan evidence lookup.

## Columns

| column | type | required | notes |
|---|---|---:|---|
| `id` | `uuid` | yes | primary key |
| `paper_id` | `uuid` | yes | foreign key ke `papers.id` |
| `project_id` | `uuid` | yes | denormalized untuk query cepat |
| `chunk_index` | `integer` | yes | urutan chunk dalam paper |
| `page_start` | `integer` | yes | halaman awal |
| `page_end` | `integer` | yes | halaman akhir |
| `source_type` | `chunk_source_type` | yes | page/section/paragraph |
| `section_label` | `text` | no | mis. `Introduction`, `Method` |
| `content` | `text` | yes | isi chunk |
| `content_hash` | `text` | no | untuk validasi / dedupe / trace |
| `char_count` | `integer` | yes | panjang karakter |
| `token_estimate` | `integer` | no | perkiraan token |
| `created_at` | `timestamptz` | yes | default `now()` |

## Indexes

- index on `paper_id`
- unique index on `(paper_id, chunk_index)`
- index on `(paper_id, page_start, page_end)`

## Constraints

- `chunk_index >= 0`
- `page_start > 0`
- `page_end >= page_start`
- `char_count > 0`

---

## Table: `paper_insights`

## Purpose

Menyimpan structured summary utama untuk satu paper.

## Columns

| column | type | required | notes |
|---|---|---:|---|
| `id` | `uuid` | yes | primary key |
| `paper_id` | `uuid` | yes | foreign key ke `papers.id` |
| `project_id` | `uuid` | yes | denormalized untuk query cepat |
| `analysis_job_id` | `uuid` | yes | foreign key ke `analysis_jobs.id` |
| `title` | `text` | no | hasil AI atau metadata |
| `authors` | `jsonb` | no | array nama author |
| `publication_year` | `integer` | no | tahun publikasi |
| `research_problem` | `text` | no | masalah riset |
| `method` | `text` | no | pendekatan/metode |
| `dataset_or_object` | `text` | no | dataset atau object penelitian |
| `key_findings` | `jsonb` | no | array temuan utama |
| `limitations` | `jsonb` | no | array limitation |
| `keywords` | `jsonb` | no | array keyword |
| `summary_markdown` | `text` | no | optional rendered summary |
| `prompt_version` | `text` | yes | versi prompt |
| `schema_version` | `text` | yes | versi schema |
| `model_provider` | `text` | yes | provider LLM |
| `model_name` | `text` | yes | nama model |
| `created_at` | `timestamptz` | yes | default `now()` |
| `updated_at` | `timestamptz` | yes | default `now()` |

## Indexes

- index on `paper_id`
- index on `analysis_job_id`
- index on `project_id`

## Notes

- untuk MVP 1, satu paper idealnya punya satu hasil final aktif
- kalau mau simpan history versi insight, nanti bisa tambah `is_active` atau `superseded_by`

---

## Table: `insight_evidence`

## Purpose

Menyimpan bukti untuk klaim penting pada summary paper.

## Columns

| column | type | required | notes |
|---|---|---:|---|
| `id` | `uuid` | yes | primary key |
| `paper_insight_id` | `uuid` | yes | foreign key ke `paper_insights.id` |
| `paper_id` | `uuid` | yes | denormalized untuk query cepat |
| `chunk_id` | `uuid` | yes | foreign key ke `paper_chunks.id` |
| `insight_field` | `text` | yes | mis. `research_problem`, `method`, `key_findings` |
| `claim_label` | `text` | no | label singkat untuk klaim |
| `quote` | `text` | yes | kutipan persis dari source chunk |
| `page` | `integer` | yes | halaman utama quote |
| `confidence` | `insight_confidence` | no | low/medium/high |
| `explanation` | `text` | no | kenapa quote ini mendukung klaim |
| `created_at` | `timestamptz` | yes | default `now()` |

## Indexes

- index on `paper_insight_id`
- index on `paper_id`
- index on `chunk_id`
- index on `insight_field`

## Constraints

- `page > 0`
- `quote` tidak boleh kosong

## Important Validation Rule

Saat save evidence, backend harus cek bahwa isi `quote` benar-benar ada di `paper_chunks.content` untuk `chunk_id` yang dirujuk.

---

## Storage Layout

## Bucket

- bucket: `papers`

## Path Convention

```txt
users/{userId}/projects/{projectId}/papers/{paperId}/original.pdf
```

## Why This Structure

- mudah diaudit
- mudah dibersihkan per project
- mudah dipetakan ke ownership
- aman untuk multi-tenant access policy

---

## RLS Direction

## General Rule

Semua tabel app-level di schema exposed harus mengaktifkan RLS.

## Access Model

- owner project boleh read/write project miliknya
- row paper, job, chunk, insight, dan evidence selalu mengikuti ownership dari parent `project`
- jangan pakai metadata yang bisa diedit user sebagai dasar authorization

## Practical Policy Pattern

- `projects`: allow jika `owner_id = current_user_id`
- `papers`: allow jika parent `project.owner_id = current_user_id`
- `analysis_jobs`: allow jika parent `project.owner_id = current_user_id`
- `paper_chunks`: allow jika parent `project.owner_id = current_user_id`
- `paper_insights`: allow jika parent `project.owner_id = current_user_id`
- `insight_evidence`: allow jika parent `project.owner_id = current_user_id`

---

## Recommended Drizzle Modeling Notes

- pakai `jsonb` untuk `authors`, `key_findings`, `limitations`, dan `keywords`
- pakai enum database untuk `paper_status`, `job_status`, dan `insight_confidence`
- tambahkan helper `updated_at` auto-update di app layer atau trigger
- kalau embeddings baru masuk nanti, tambah tabel terpisah atau kolom vector di `paper_chunks`

---

## MVP 1 Minimum Queries Needed

### Project Workspace
- list projects by owner
- get project detail by id

### Paper Workspace
- list papers by project
- create paper metadata row after upload
- get paper detail with latest job status

### Analysis Pipeline
- create analysis job
- update analysis job status per step
- insert chunks in batch
- insert final insight
- insert evidence rows

### Frontend Read Models
- get project + papers summary
- get paper + latest insight + evidence

---

## Nice To Add Soon After MVP 1

- `analysis_job_events` untuk event log detail per step
- `prompt_templates` untuk versioning prompt yang lebih formal
- `paper_embeddings` jika retrieval makin kompleks
- `paper_files` jika nanti mau simpan processed derivatives selain file asli

---

## Suggested Build Order For Schema

1. auth tables via Better Auth adapter
2. `projects`
3. `papers`
4. `analysis_jobs`
5. `paper_chunks`
6. `paper_insights`
7. `insight_evidence`

Urutan ini paling aman karena mengikuti dependency graph dan flow MVP 1.
