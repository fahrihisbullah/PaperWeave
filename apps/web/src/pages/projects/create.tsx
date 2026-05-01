import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, ApiError } from '../../lib/api'

export function CreateProjectPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setIsLoading(true)

    try {
      const newProject = await api.post<{ id: string }>('/api/projects', {
        title: title.trim(),
        description: description.trim() || undefined,
      })

      navigate(`/projects/${newProject.id}`)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to create project')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
        <div className="mb-8 flex items-center gap-5">
          <Link
            to="/projects"
            className="text-[15px] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            Back
          </Link>
          <h1 className="font-display text-[2.2rem] leading-none text-[var(--color-text)]">
            New Project
          </h1>
        </div>

        {error && (
          <div className="mb-5 rounded-xl bg-red-50 p-3.5 text-[14px] text-red-600">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="title"
              className="mb-2 block text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--color-text-muted)]"
            >
              Project Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={255}
              className="block w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[15px] text-[var(--color-text)] transition-all focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
              placeholder="My Literature Review"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--color-text-muted)]"
            >
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={1000}
              className="block w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[15px] text-[var(--color-text)] transition-all focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
              placeholder="Optional description..."
            />
          </div>

          <div className="flex gap-4">
            <Link
              to="/projects"
              className="flex-1 rounded-xl border border-[var(--color-border)] px-4 py-3 text-center text-[15px] text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg)]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-xl bg-[var(--color-primary)] px-4 py-3 text-[15px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
