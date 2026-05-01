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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function PaperStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    uploaded: 'bg-blue-100 text-blue-800',
    queued: 'bg-yellow-100 text-yellow-800',
    extracting: 'bg-purple-100 text-purple-800',
    summarizing: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  }
  return (
    <span
      className={`px-2 py-0.5 text-xs rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}
    >
      {status}
    </span>
  )
}

export function PaperList({ papers, projectId, onRefresh }: PaperListProps) {
  const navigate = useNavigate()

  const uploadedCount = papers.filter((p) => p.status === 'uploaded').length
  const failedCount = papers.filter((p) => p.status === 'failed').length
  const processingCount = papers.filter((p) =>
    ['queued', 'extracting', 'summarizing'].includes(p.status)
  ).length

  const handleDelete = async (paperId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this paper?')) return

    try {
      await api.delete(`/api/papers/${paperId}`)
      onRefresh()
    } catch (err) {
      console.error('Failed to delete paper:', err)
    }
  }

  const handleBulkAnalyze = async () => {
    try {
      await api.post('/api/analysis/bulk/analyze-all', { projectId })
      onRefresh()
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to trigger bulk analysis'
      alert(msg)
    }
  }

  const handleBulkRetry = async () => {
    try {
      await api.post('/api/analysis/bulk/retry-failed', { projectId })
      onRefresh()
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to retry failed papers'
      alert(msg)
    }
  }

  if (papers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">No papers yet. Upload your first PDF to get started.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Bulk Actions Bar */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">
          {papers.length} paper{papers.length !== 1 ? 's' : ''}
          {processingCount > 0 && (
            <span className="ml-2 text-yellow-600">({processingCount} processing)</span>
          )}
        </p>
        <div className="flex gap-2">
          {uploadedCount > 0 && (
            <button
              onClick={handleBulkAnalyze}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Analyze All ({uploadedCount})
            </button>
          )}
          {failedCount > 0 && (
            <button
              onClick={handleBulkRetry}
              className="px-3 py-1.5 text-xs bg-orange-600 text-white rounded-md hover:bg-orange-700"
            >
              Retry Failed ({failedCount})
            </button>
          )}
        </div>
      </div>

      {/* Paper Items */}
      <div className="bg-white rounded-lg shadow divide-y">
        {papers.map((paper) => (
          <div
            key={paper.id}
            className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => navigate(`/projects/${projectId}/papers/${paper.id}`)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-red-500 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                    clipRule="evenodd"
                  />
                </svg>
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {paper.title || paper.original_filename}
                </h3>
                <PaperStatusBadge status={paper.status} />
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                <span>{formatFileSize(paper.file_size_bytes)}</span>
                <span>{new Date(paper.created_at).toLocaleDateString()}</span>
                {paper.total_pages && <span>{paper.total_pages} pages</span>}
              </div>
            </div>
            <button
              onClick={(e) => handleDelete(paper.id, e)}
              className="ml-4 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete paper"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
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
