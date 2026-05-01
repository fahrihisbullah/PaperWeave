# PaperWeave

**AI-powered literature review workspace for students and researchers.**

Upload research papers, extract structured insights, discover cross-paper connections, and generate literature review drafts — all with evidence traceable back to source pages.

---

## Features

### Core Pipeline

- **PDF Upload & Storage** — Drag & drop multiple PDFs into project workspaces (Supabase Storage)
- **AI Text Extraction** — Automatic text extraction and chunking per page/paragraph
- **Structured Summarization** — AI generates title, authors, method, findings, limitations, keywords with Zod-validated output
- **Evidence Validation** — Every insight is backed by exact quotes traced to source pages
- **Cross-Paper Synthesis** — Theme clustering, relation detection (supports/contradicts/extends), research gap identification
- **Literature Review Drafting** — AI generates structured drafts (intro, themes, comparison, gaps, conclusion)
- **Semantic Search (RAG)** — Ask natural language questions, get answers with citations from your papers
- **Visual Graph Explorer** — Interactive React Flow graph showing paper relationships and theme clusters

### Reliability

- Async pipeline with status tracking (pending → processing → completed → failed)
- Retry failed analyses (max 3 retries, idempotent)
- Guardrails: max 200 pages, 500 chunks, 5-minute timeout per job
- Cost estimation and token usage tracking per job
- Step-based logging for debugging

### UI/UX

- Modern SaaS design (Calm Academic + Swiss Editorial style)
- Responsive layout with sidebar navigation
- Multi-file upload with per-file progress
- Bulk actions: Analyze All, Retry Failed
- Project CRUD (create, edit, delete)
- Export drafts as Markdown

---

## Tech Stack

### Frontend

- React 19 + Vite
- TypeScript
- Tailwind CSS v4
- React Flow (@xyflow/react) for graph visualization
- Better Auth client for session management

### Backend

- Hono (Node.js HTTP framework)
- TypeScript
- Drizzle ORM + PostgreSQL
- Better Auth (email/password authentication)
- LangChain.js for AI orchestration

### AI Providers (pick one)

| Provider   | Model Example                       | Cost                |
| ---------- | ----------------------------------- | ------------------- |
| Groq       | `llama-3.3-70b-versatile`           | Free (rate limited) |
| OpenRouter | `meta-llama/llama-3.1-70b-instruct` | Pay-per-token       |
| OpenAI     | `gpt-4o-mini`                       | $$                  |
| Anthropic  | `claude-sonet-4-20250514`           | $                   |
| Google     | `gemini-2.0-flash`                  | Free tier available |

### Database & Storage

- Supabase PostgreSQL (with pgvector for embeddings)
- Supabase Storage (PDF file storage)

---

## Prerequisites

- Node.js 20+
- pnpm 9+
- Supabase project (free tier works)

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/fahrihisbullah/PaperWeave.git
cd PaperWeave
pnpm install
```

### 2. Configure Environment

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Edit `apps/api/.env`:

```env
# Database (from Supabase → Settings → Database → Connection string)
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# Supabase (from Supabase → Settings → API)
SUPABASE_URL=https://[ref].supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Auth
AUTH_SECRET=your-secret-at-least-32-characters
API_URL=http://localhost:3000

# AI Provider (pick one)
AI_MODEL_PROVIDER=groq
AI_MODEL_NAME=llama-3.3-70b-versatile
GROQ_API_KEY=gsk_...

# Optional: for embeddings/RAG (requires OpenAI)
OPENAI_API_KEY=sk-...
```

### 3. Run Migrations

```bash
pnpm --filter @paperweave/api db:migrate
```

### 4. Create Storage Bucket

Create a bucket named `papers` in your Supabase dashboard (Storage → New Bucket → name: `papers`, private).

### 5. Start Development

```bash
# Start both frontend and backend
pnpm dev

# Or individually:
pnpm --filter @paperweave/api dev    # API on http://localhost:3000
pnpm --filter @paperweave/web dev    # Web on http://localhost:5173
```

### 6. Open App

Visit `http://localhost:5173`, create an account, and start uploading papers!

---

## User Flow

```
1. Create Project
2. Upload PDFs (drag & drop, multiple files)
3. Click "Analyze All" → AI extracts & summarizes each paper
4. View insights per paper (findings, method, evidence quotes)
5. Generate Synthesis (themes, relations, research gaps)
6. Generate Literature Review Draft
7. Edit & Export as Markdown
```

---

## Project Structure

```
PaperWeave/
├── apps/
│   ├── web/                    # React + Vite frontend
│   │   ├── src/
│   │   │   ├── components/     # Reusable UI components
│   │   │   ├── pages/          # Route pages
│   │   │   ├── lib/            # API client, auth hooks
│   │   │   └── index.css       # Design tokens + Tailwind
│   │   └── vite.config.ts
│   └── api/                    # Hono backend
│       ├── src/
│       │   ├── routes/         # API route handlers
│       │   ├── lib/            # Pipeline, supabase, pdf-extractor, chunker
│       │   └── db/             # Drizzle schema + migrations
│       ├── drizzle/            # SQL migration files
│       └── .env
├── packages/
│   ├── shared/                 # Shared types, env validation, utils
│   └── ai/                     # LangChain AI provider + prompts + embeddings
├── pnpm-workspace.yaml
└── package.json
```

---

## API Endpoints

### Auth

| Method | Path                      | Description         |
| ------ | ------------------------- | ------------------- |
| POST   | `/api/auth/sign-up/email` | Register            |
| POST   | `/api/auth/sign-in/email` | Login               |
| GET    | `/api/auth/get-session`   | Get current session |

### Projects

| Method | Path                | Description          |
| ------ | ------------------- | -------------------- |
| GET    | `/api/projects`     | List user's projects |
| POST   | `/api/projects`     | Create project       |
| GET    | `/api/projects/:id` | Get project detail   |
| PUT    | `/api/projects/:id` | Update project       |
| DELETE | `/api/projects/:id` | Delete project       |

### Papers

| Method | Path                     | Description            |
| ------ | ------------------------ | ---------------------- |
| GET    | `/api/papers?projectId=` | List papers in project |
| POST   | `/api/papers/upload`     | Upload PDF (multipart) |
| GET    | `/api/papers/:id`        | Get paper detail       |
| DELETE | `/api/papers/:id`        | Delete paper           |

### Analysis

| Method | Path                                | Description                  |
| ------ | ----------------------------------- | ---------------------------- |
| POST   | `/api/analysis/trigger`             | Trigger analysis for a paper |
| POST   | `/api/analysis/retry`               | Retry failed analysis        |
| POST   | `/api/analysis/bulk/analyze-all`    | Analyze all uploaded papers  |
| POST   | `/api/analysis/bulk/retry-failed`   | Retry all failed papers      |
| GET    | `/api/analysis/jobs/:id`            | Get job status               |
| GET    | `/api/analysis/jobs?paperId=`       | List jobs for a paper        |
| GET    | `/api/analysis/chunks?paperId=`     | Get chunks for a paper       |
| GET    | `/api/analysis/insights?paperId=`   | Get insights for a paper     |
| GET    | `/api/analysis/evidence?insightId=` | Get evidence for an insight  |

### Synthesis & Drafts

| Method | Path                        | Description                      |
| ------ | --------------------------- | -------------------------------- |
| POST   | `/api/synthesis/generate`   | Generate cross-paper synthesis   |
| GET    | `/api/synthesis?projectId=` | Get synthesis data               |
| POST   | `/api/drafts/generate`      | Generate literature review draft |
| GET    | `/api/drafts?projectId=`    | List drafts                      |
| GET    | `/api/drafts/:id`           | Get draft                        |
| PUT    | `/api/drafts/:id`           | Update draft content             |
| GET    | `/api/drafts/:id/export`    | Export as .md file               |

### Search (RAG)

| Method | Path                | Description                                |
| ------ | ------------------- | ------------------------------------------ |
| POST   | `/api/search/query` | Semantic search across papers              |
| POST   | `/api/search/ask`   | Ask question, get AI answer with citations |

---

## Database Schema

| Table              | Purpose                                          |
| ------------------ | ------------------------------------------------ |
| `user`             | Auth users                                       |
| `session`          | Auth sessions                                    |
| `account`          | Auth accounts                                    |
| `verification`     | Auth verification tokens                         |
| `projects`         | User workspaces                                  |
| `papers`           | Uploaded PDFs metadata                           |
| `analysis_jobs`    | Processing job tracking                          |
| `paper_chunks`     | Extracted text chunks (with pgvector embeddings) |
| `paper_insights`   | AI-generated structured summaries                |
| `insight_evidence` | Evidence quotes linked to chunks                 |
| `paper_relations`  | Pairwise paper relationships                     |
| `themes`           | Theme clusters per project                       |
| `theme_papers`     | Paper-to-theme mapping                           |
| `review_drafts`    | Generated literature review drafts               |

---

## Scripts

```bash
pnpm dev              # Start all apps
pnpm build            # Build all packages
pnpm typecheck        # TypeScript check
pnpm lint             # ESLint
pnpm format           # Prettier

# Database
pnpm --filter @paperweave/api db:generate   # Generate migrations
pnpm --filter @paperweave/api db:migrate    # Apply migrations
pnpm --filter @paperweave/api db:studio     # Open Drizzle Studio
```

---

## Design System

- **Style**: Calm Academic + Swiss Editorial
- **Colors**: Warm off-white (`#f7f6f2`), teal accent (`#01696f`)
- **Typography**: Instrument Serif (headings) + General Sans (body)
- **References**: Elicit.org, Readwise Reader, Zotero Web

---

## License

MIT

---

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request
