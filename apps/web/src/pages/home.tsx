import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth-hooks'

export function HomePage() {
  const { session, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse"></div>
      </div>
    )
  }

  if (session) {
    return <Navigate to="/projects" replace />
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]"></span>
            <span className="font-display text-[1.5rem] leading-none">PaperWeave</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] md:text-[15px]"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 md:text-[15px]"
            >
              Start for Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-20 lg:pb-28 lg:pt-28">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-20">
          {/* Left: Copy */}
          <div>
            <span className="mb-7 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-bg)] px-4 py-1.5 text-[13px] font-medium text-[var(--color-primary)]">
              ✦ AI-Powered Research
            </span>
            <h1 className="mb-6 max-w-[11ch] font-display text-[2.9rem] leading-[1.02] tracking-[-0.03em] sm:text-[3.35rem] lg:text-[4.6rem]">
              Your literature review,
              <br />
              <em className="text-[var(--color-primary)]">structured and traceable</em>
            </h1>
            <p className="mb-9 max-w-[35rem] text-[1.05rem] leading-[1.75] text-[var(--color-text-muted)] lg:text-[1.22rem]">
              Upload papers, extract insights with AI, discover connections between research, and
              generate structured literature reviews — all with evidence you can trace back.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/register"
                className="rounded-lg bg-[var(--color-primary)] px-6 py-3 text-[15px] font-semibold text-white transition-opacity hover:opacity-90 lg:text-base"
              >
                Start for Free
              </Link>
              <Link
                to="/login"
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 text-[15px] font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg)] lg:text-base"
              >
                See Demo
              </Link>
            </div>
            <p className="mt-5 text-[13px] text-[var(--color-text-faint)] lg:text-[14px]">
              No credit card required · Free for students
            </p>
          </div>

          {/* Right: Preview card mockup */}
          <div className="hidden lg:block">
            <div className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]"></span>
                <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-faint)]">
                  AI Insight
                </span>
              </div>
              <p className="mb-2 max-w-[26ch] text-[1.6rem] font-medium leading-[1.45] text-[var(--color-text)]">
                <span className="text-[var(--color-primary)] font-semibold">
                  Consistent finding:
                </span>{' '}
                Three studies confirm that transformer-based models outperform traditional NLP
                methods for academic text summarization.
              </p>
              <div className="mt-6 flex items-center gap-4 border-t border-[var(--color-divider)] pt-5 text-[13px] text-[var(--color-text-faint)]">
                <span>3 papers</span>
                <span>·</span>
                <span>High confidence</span>
                <span>·</span>
                <span>p.12, p.8, p.23</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="mx-auto max-w-6xl px-6 pb-24 lg:pb-28">
        <div className="mb-16 text-center lg:mb-20">
          <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
            How it works
          </p>
          <h2 className="mx-auto max-w-[18ch] font-display text-[2.35rem] leading-[1.05] tracking-[-0.02em] sm:text-[2.8rem] lg:text-[3.4rem]">
            From papers to literature review in 4 steps
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          <StepCard
            step="01"
            title="Upload Papers"
            description="Drag & drop your PDF research papers into a project workspace."
          />
          <StepCard
            step="02"
            title="AI Analysis"
            description="AI extracts text, identifies key findings, methods, and limitations per paper."
          />
          <StepCard
            step="03"
            title="Synthesis"
            description="Discover themes, compare papers, and identify research gaps automatically."
          />
          <StepCard
            step="04"
            title="Generate Review"
            description="Get a structured literature review draft ready to edit and export."
          />
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-24 lg:pb-28">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {/* Featured card (spans 2 rows on md+) */}
          <div className="flex flex-col justify-end rounded-[1.75rem] bg-[var(--color-text)] p-8 text-white md:row-span-2">
            <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-white/50">
              Smart Extraction
            </p>
            <h3 className="mb-3 text-[1.7rem] font-medium leading-[1.2]">
              Upload PDFs and get structured insights in seconds
            </h3>
            <p className="text-[1rem] leading-[1.8] text-white/65">
              AI extracts key findings, methodology, limitations, and keywords — with evidence
              quotes traced back to exact pages.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-7">
            <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-faint)]">
              Cross-Paper Synthesis
            </p>
            <h3 className="mb-3 text-[1.55rem] font-medium leading-[1.25]">
              Discover themes and research gaps
            </h3>
            <p className="text-[1rem] leading-[1.75] text-[var(--color-text-muted)]">
              Automatically cluster papers by theme, detect relationships, and identify what's
              missing in the literature.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-7">
            <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-faint)]">
              Draft Generation
            </p>
            <h3 className="mb-3 text-[1.55rem] font-medium leading-[1.25]">
              Generate literature reviews you can edit
            </h3>
            <p className="text-[1rem] leading-[1.75] text-[var(--color-text-muted)]">
              AI drafts structured reviews with introduction, thematic analysis, comparison, and
              conclusion — ready for export.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-7">
            <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-faint)]">
              Ask Your Papers
            </p>
            <h3 className="mb-3 text-[1.55rem] font-medium leading-[1.25]">
              RAG-powered Q&A across all your research
            </h3>
            <p className="text-[1rem] leading-[1.75] text-[var(--color-text-muted)]">
              Ask natural language questions and get answers with citations from your uploaded
              papers.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

function StepCard({
  step,
  title,
  description,
}: {
  step: string
  title: string
  description: string
}) {
  return (
    <div className="relative rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 lg:p-8">
      <div className="mb-5 font-display text-[3.3rem] leading-none text-[var(--color-primary)]/20 lg:text-[4rem]">
        {step}
      </div>
      <h3 className="mb-3 text-[1.45rem] font-semibold leading-[1.2] text-[var(--color-text)] lg:text-[1.6rem]">
        {title}
      </h3>
      <p className="text-[1rem] leading-[1.8] text-[var(--color-text-muted)] lg:text-[1.05rem]">
        {description}
      </p>
    </div>
  )
}
