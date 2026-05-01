import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, ApiError } from '../../lib/api'

interface Project {
  id: string
  title: string
  description: string | null
  status: string
  created_at: string
  updated_at: string
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

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [papers, setPapers] = useState<Paper[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Upload state
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const fetchProject = useCallback(async (projectId: string) => {
    try {
      const data = await api.get<Project>(`/api/projects/${projectId}`)
      setProject(data)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to fetch project')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchPapers = useCallback(async (projectId: string) => {
    try {
      const data = await api.get<Paper[]>(`/api/papers?projectId=${projectId}`)
      setPapers(data)
    } catch (err) {
      console.error('Failed to fetch papers:', err)
    }
  }, [])

  useEffect(() => {
    if (id) {
      fetchProject(id)
      fetchPapers(id)
    }
  }, [id, fetchProject, fetchPapers])

  const handleUpload = async (file: File) => {
    if (!id) return

    setUploadError('')
    setUploadSuccess('')

    // Client-side validation
    if (file.type !== 'application/pdf') {
      setUploadError('Only PDF files are allowed')
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      setUploadError('File too large. Max size is 20MB')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectId', id)

      await api.upload<Paper>('/api/papers/upload', formData)
      setUploadSuccess(`"${file.name}" uploaded successfully!`)
      // Refresh papers list
      fetchPapers(id)
    } catch (err) {
      if (err instanceof ApiError) {
        setUploadError(err.message)
      } else {
        setUploadError('Upload failed. Please try again.')
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleUpload(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleDeletePaper = async (paperId: string) => {
    if (!id) return
    if (!confirm('Are you sure you want to delete this paper?')) return

    try {
      await api.delete(`/api/papers/${paperId}`)
      fetchPapers(id)
    } catch (err) {
      console.error('Failed to delete paper:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-red-600 mb-4">{error || 'Project not found'}</p>
          <Link to="/projects" className="text-blue-600 hover:text-blue-800">
            Back to Projects
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to="/projects" className="text-gray-600 hover:text-gray-800 text-sm">
          &larr; Back to Projects
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold">{project.title}</h1>
          <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
            {project.status}
          </span>
        </div>

        {project.description && <p className="text-gray-600 mb-4">{project.description}</p>}

        <p className="text-sm text-gray-400">
          Created {new Date(project.created_at).toLocaleDateString()}
        </p>
      </div>

      {/* Upload Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Papers</h2>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {isUploading ? (
            <div>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-600">Uploading...</p>
            </div>
          ) : (
            <div>
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-3"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-gray-600 mb-2">
                Drag and drop a PDF here, or{' '}
                <label className="text-blue-600 hover:text-blue-800 cursor-pointer underline">
                  browse
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                </label>
              </p>
              <p className="text-xs text-gray-400">PDF only, max 20MB</p>
            </div>
          )}
        </div>

        {/* Upload feedback */}
        {uploadError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{uploadError}</p>
          </div>
        )}
        {uploadSuccess && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-700">{uploadSuccess}</p>
          </div>
        )}

        {/* Papers List */}
        <div className="mt-6">
          {papers.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-500">No papers yet. Upload your first PDF to get started.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow divide-y">
              {papers.map((paper) => (
                <div key={paper.id} className="p-4 flex items-center justify-between">
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
                    onClick={() => handleDeletePaper(paper.id)}
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
          )}
        </div>
      </div>
    </div>
  )
}
