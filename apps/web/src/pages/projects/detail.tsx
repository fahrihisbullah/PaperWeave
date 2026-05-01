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

  // Auto-refresh when papers are processing
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

      {/* Project Header */}
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

      {/* Search / Ask */}
      {papers.some((p) => p.status === 'completed') && (
        <div className="mt-8">
          <PaperSearch projectId={id!} />
        </div>
      )}

      {/* Synthesis Link */}
      {papers.filter((p) => p.status === 'completed').length >= 2 && (
        <div className="mt-6">
          <Link
            to={`/projects/${id}/synthesis`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Synthesis & Review
          </Link>
        </div>
      )}

      {/* Papers Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Papers</h2>

        <PaperUpload projectId={id!} onUploadComplete={() => fetchPapers(id!)} />

        <div className="mt-6">
          <PaperList papers={papers} projectId={id!} onRefresh={() => fetchPapers(id!)} />
        </div>
      </div>
    </div>
  )
}
