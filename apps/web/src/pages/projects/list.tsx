import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../../lib/api'
import type { Project } from '@paperweave/shared'

interface Paper {
  id: string
  project_id: string
  status: string
}

interface ProjectWithStats extends Project {
  paperCount?: number
  completedCount?: number
}

export function ProjectListPage() {
  const [projects, setProjects] = useState<ProjectWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const data = await api.get<Project[]>('/api/projects')
      const enriched: ProjectWithStats[] = await Promise.all(
        data.map(async (project) => {
          try {
            const papers = await api.get<Paper[]>(`/api/papers?projectId=${project.id}`)
            return {
              ...project,
              paperCount: papers.length,
              completedCount: papers.filter((p) => p.status === 'completed').length,
            }
          } catch {
            return { ...project, paperCount: 0, completedCount: 0 }
          }
        })
      )
      setProjects(enriched)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to fetch projects')
    } finally {
      setIsLoading(false)
    }
  }

  const totalPapers = projects.reduce((sum, p) => sum + (p.paperCount || 0), 0)
  const totalCompleted = projects.reduce((sum, p) => sum + (p.completedCount || 0), 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] animate-pulse"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <p className="mb-4 text-[15px] text-red-600">{error}</p>
          <button
            onClick={fetchProjects}
            className="text-[15px] font-medium text-[var(--color-primary)] hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-10 flex items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-[2.6rem] leading-none tracking-[-0.03em]">Projects</h1>
          <p className="mt-3 text-[1.02rem] text-[var(--color-text-muted)]">
            Your literature review workspaces
          </p>
        </div>
        <Link
          to="/projects/new"
          className="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
        >
          New Project
        </Link>
      </div>

      {/* Stats */}
      {projects.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard label="Projects" value={projects.length} />
          <StatCard label="Total Papers" value={totalPapers} />
          <StatCard label="Analyzed" value={totalCompleted} />
          <StatCard label="Pending" value={totalPapers - totalCompleted} />
        </div>
      )}

      {/* Project List */}
      {projects.length === 0 ? (
        <div className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-8 py-16 text-center">
          <p className="mb-5 text-[1.05rem] text-[var(--color-text-muted)]">No projects yet</p>
          <Link
            to="/projects/new"
            className="inline-block rounded-xl bg-[var(--color-primary)] px-5 py-3 text-[15px] font-semibold text-white hover:opacity-90"
          >
            Create your first project
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="block bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-6 py-5 hover:border-[var(--color-primary)]/25 hover:shadow-sm transition-all group"
            >
              <div className="flex justify-between items-center">
                <div className="min-w-0 flex-1">
                  <h2 className="text-[1.2rem] font-semibold text-[var(--color-text)] transition-colors group-hover:text-[var(--color-primary)]">
                    {project.title}
                  </h2>
                  {project.description && (
                    <p className="mt-1.5 line-clamp-1 text-[15px] text-[var(--color-text-muted)]">
                      {project.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-4 text-[13px] text-[var(--color-text-faint)]">
                    <span>{project.paperCount || 0} papers</span>
                    {(project.completedCount || 0) > 0 && (
                      <span className="text-[var(--color-primary)]">
                        {project.completedCount} analyzed
                      </span>
                    )}
                    <span>{new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className="ml-4 text-[15px] text-[var(--color-text-faint)] transition-colors group-hover:text-[var(--color-primary)]">
                  Open
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4">
      <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-faint)]">
        {label}
      </p>
      <p className="text-[2rem] font-semibold tabular-nums text-[var(--color-text)]">{value}</p>
    </div>
  )
}
