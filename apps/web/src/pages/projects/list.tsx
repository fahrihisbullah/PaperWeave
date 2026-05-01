import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../../lib/api'
import type { Project } from '@paperweave/shared'

function EditProjectModal({
  project,
  onClose,
  onSaved,
}: {
  project: ProjectWithStats
  onClose: () => void
  onSaved: () => void
}) {
  const [title, setTitle] = useState(project.title)
  const [description, setDescription] = useState(project.description || '')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setIsSaving(true)
    try {
      await api.put(`/api/projects/${project.id}`, {
        title: title.trim(),
        description: description.trim() || null,
      })
      onSaved()
      onClose()
    } catch {
      alert('Failed to update project')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold mb-5">Edit Project</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-sm font-semibold bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

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

  const [editingProject, setEditingProject] = useState<ProjectWithStats | null>(null)

  const totalPapers = projects.reduce((sum, p) => sum + (p.paperCount || 0), 0)
  const totalCompleted = projects.reduce((sum, p) => sum + (p.completedCount || 0), 0)

  const handleDelete = async (projectId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Delete this project and all its papers? This cannot be undone.')) return
    try {
      await api.delete(`/api/projects/${projectId}`)
      fetchProjects()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to delete')
    }
  }

  const handleEdit = (project: ProjectWithStats, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingProject(project)
  }

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
                <div className="ml-4 flex items-center gap-1">
                  <button
                    onClick={(e) => handleEdit(project, e)}
                    className="p-2 rounded-lg text-[var(--color-text-faint)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-bg)] transition-colors"
                    title="Edit project"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => handleDelete(project.id, e)}
                    className="p-2 rounded-lg text-[var(--color-text-faint)] hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Delete project"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSaved={fetchProjects}
        />
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
