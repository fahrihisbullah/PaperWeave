import { useNavigate } from 'react-router-dom'
import { api, ApiError } from '../lib/api'

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

interface PaperListProps {
  papers: Paper[]
  projectId: string
  onRefresh: () => void
}

const STATUS_STYLES: Record<string, string> = {
  uploaded:
    'bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)]',
  queued: 'bg-amber-50 text-amber-700',
  extracting: 'bg-purple-50 text-purple-700',
  summarizing: 'bg-[var(--color-primary-bg)] text-[var(--color-primary)]',
  completed: 'bg-emerald-50 text-emerald-700',
  failed: 'bg-red-50 text-red-700',
}

export function PaperList({ papers, projectId, onRefresh }: PaperListProps) {
  const navigate = useNavigate()

  const uploadedCount = papers.filter((p) => p.status === 'uploaded').length
  const failedCount = papers.filter((p) => p.status === 'failed').length

  const handleDelete = async (paperId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this paper?')) return
    try {
      await api.delete(`/api/papers/${paperId}`)
      onRefresh()
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const handleBulkAnalyze = async () => {
    try {
      await api.post('/api/analysis/bulk/analyze-all', { projectId })
      onRefresh()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed')
    }
  }

  const handleBulkRetry = async () => {
    try {
      await api.post('/api/analysis/bulk/retry-failed', { projectId })
      onRefresh()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed')
    }
  }

  if (papers.length === 0) {
    return (
      <p className="py-10 text-center text-[15px] text-[var(--color-text-faint)]">
        No papers yet. Upload your first PDF above.
      </p>
    )
  }

  return (
    <div>
      {/* Actions */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-[13px] text-[var(--color-text-faint)]">
          {papers.length} paper{papers.length !== 1 ? 's' : ''}
        </p>
        <div className="flex gap-2">
          {uploadedCount > 0 && (
            <button
              onClick={handleBulkAnalyze}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              Analyze All ({uploadedCount})
            </button>
          )}
          {failedCount > 0 && (
            <button
              onClick={handleBulkRetry}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-[14px] font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg)]"
            >
              Retry Failed ({failedCount})
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-divider)]">
        {papers.map((paper) => (
          <div
            key={paper.id}
            className="flex cursor-pointer items-center justify-between px-6 py-5 transition-colors hover:bg-[var(--color-bg)]/60"
            onClick={() => navigate(`/projects/${projectId}/papers/${paper.id}`)}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <h3 className="truncate text-[16px] font-medium text-[var(--color-text)]">
                  {paper.title || paper.original_filename}
                </h3>
                <span
                  className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold ${STATUS_STYLES[paper.status] || ''}`}
                >
                  {paper.status}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-4 text-[13px] text-[var(--color-text-faint)]">
                <span>{(paper.file_size_bytes / 1024).toFixed(0)} KB</span>
                {paper.total_pages && <span>{paper.total_pages} pages</span>}
                <span>{new Date(paper.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <button
              onClick={(e) => handleDelete(paper.id, e)}
              className="ml-4 p-2 text-[var(--color-text-faint)] hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
              title="Delete"
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
        ))}
      </div>
    </div>
  )
}
