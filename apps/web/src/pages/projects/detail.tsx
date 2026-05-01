import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, ApiError } from '../../lib/api'
import { PaperUpload } from '../../components/paper-upload'
import { PaperList } from '../../components/paper-list'
import { PaperSearch } from '../../components/paper-search'

interface Project {
  id: string
  title: string
  description: string | null
  status: string
  created_at: string
}

interface Paper {
  id: string
  project_id: string
  title: string | null
  original_filename: string
  mime_type: string
  file_size_bytes: number
  status: string
  total_pages: number | null
  created_at: string
  updated_at: string
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [papers, setPapers] = useState<Paper[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchProject = useCallback(async (projectId: string) => {
    try {
      const data = await api.get<Project>(`/api/projects/${projectId}`)
      setProject(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to fetch project')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchPapers = useCallback(async (projectId: string) => {
    try {
      const data = await api.get<Paper[]>(`/api/papers?projectId=${projectId}`)
      setPapers(data)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (id) {
      fetchProject(id)
      fetchPapers(id)
    }
  }, [id, fetchProject, fetchPapers])

  const hasProcessing = papers.some((p) =>
    ['queued', 'extracting', 'summarizing'].includes(p.status)
  )
  useEffect(() => {
    if (!hasProcessing || !id) return
    const interval = setInterval(() => fetchPapers(id), 4000)
    return () => clearInterval(interval)
  }, [hasProcessing, id, fetchPapers])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] animate-pulse"></div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="text-center py-16">
        <p className="mb-4 text-[15px] text-red-600">{error || 'Project not found'}</p>
        <Link to="/projects" className="text-[15px] text-[var(--color-primary)] hover:underline">
          Back to Projects
        </Link>
      </div>
    )
  }

  const completedCount = papers.filter((p) => p.status === 'completed').length

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-[15px] text-[var(--color-text-faint)]">
        <Link to="/projects" className="hover:text-[var(--color-text-muted)] transition-colors">
          Projects
        </Link>
        <span>/</span>
        <span className="text-[var(--color-text-muted)]">{project.title}</span>
      </nav>

      {/* Project Header */}
      <div className="mb-10">
        <h1 className="font-display text-[2.8rem] leading-none tracking-[-0.03em]">
          {project.title}
        </h1>
        {project.description && (
          <p className="mt-3 max-w-[60ch] text-[1.05rem] leading-[1.75] text-[var(--color-text-muted)]">
            {project.description}
          </p>
        )}
      </div>

      {/* Search */}
      {completedCount > 0 && (
        <section className="mb-10">
          <PaperSearch projectId={id!} />
        </section>
      )}

      {/* Synthesis Link */}
      {completedCount >= 2 && (
        <section className="mb-10">
          <Link
            to={`/projects/${id}/synthesis`}
            className="inline-flex items-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 text-[15px] font-medium text-[var(--color-text)] transition-all hover:border-[var(--color-primary)]/25 hover:text-[var(--color-primary)]"
          >
            <svg
              className="w-[18px] h-[18px]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Synthesis & Literature Review
          </Link>
        </section>
      )}

      {/* Upload */}
      <section className="mb-10">
        <h2 className="mb-4 text-[1.2rem] font-semibold text-[var(--color-text)]">Upload Papers</h2>
        <PaperUpload projectId={id!} onUploadComplete={() => fetchPapers(id!)} />
      </section>

      {/* Paper List */}
      <section>
        <h2 className="mb-4 text-[1.2rem] font-semibold text-[var(--color-text)]">Papers</h2>
        <PaperList papers={papers} projectId={id!} onRefresh={() => fetchPapers(id!)} />
      </section>
    </div>
  )
}
