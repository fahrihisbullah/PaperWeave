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
  failedCount?: number
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

      // Fetch paper counts per project
      const enriched: ProjectWithStats[] = await Promise.all(
        data.map(async (project) => {
          try {
            const papers = await api.get<Paper[]>(`/api/papers?projectId=${project.id}`)
            return {
              ...project,
              paperCount: papers.length,
              completedCount: papers.filter((p) => p.status === 'completed').length,
              failedCount: papers.filter((p) => p.status === 'failed').length,
            }
          } catch {
            return { ...project, paperCount: 0, completedCount: 0, failedCount: 0 }
          }
        })
      )

      setProjects(enriched)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to fetch projects')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const totalPapers = projects.reduce((sum, p) => sum + (p.paperCount || 0), 0)
  const totalCompleted = projects.reduce((sum, p) => sum + (p.completedCount || 0), 0)
  const totalFailed = projects.reduce((sum, p) => sum + (p.failedCount || 0), 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchProjects}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your literature review projects</p>
        </div>
        <Link
          to="/projects/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </Link>
      </div>

      {/* Stats Cards */}
      {projects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Projects"
            value={projects.length}
            icon="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            color="blue"
          />
          <StatCard
            label="Total Papers"
            value={totalPapers}
            icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            color="purple"
          />
          <StatCard
            label="Analyzed"
            value={totalCompleted}
            icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            color="green"
          />
          <StatCard
            label="Failed"
            value={totalFailed}
            icon="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            color="red"
          />
        </div>
      )}

      {/* Project List */}
      {projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Create your first project to start uploading papers and generating literature reviews.
          </p>
          <Link
            to="/projects/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Project
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {project.title}
                      </h2>
                      {project.description && (
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Paper stats */}
                  <div className="flex items-center gap-4 mt-3 ml-13">
                    <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      {project.paperCount || 0} papers
                    </span>
                    {(project.completedCount || 0) > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        {project.completedCount} analyzed
                      </span>
                    )}
                    {(project.failedCount || 0) > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-red-500">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                        {project.failedCount} failed
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(project.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <svg
                  className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors mt-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: number
  icon: string
  color: string
}) {
  const colorMap: Record<string, { bg: string; iconBg: string; text: string }> = {
    blue: { bg: 'bg-blue-50', iconBg: 'bg-blue-100', text: 'text-blue-600' },
    purple: { bg: 'bg-purple-50', iconBg: 'bg-purple-100', text: 'text-purple-600' },
    green: { bg: 'bg-green-50', iconBg: 'bg-green-100', text: 'text-green-600' },
    red: { bg: 'bg-red-50', iconBg: 'bg-red-100', text: 'text-red-600' },
  }
  const c = colorMap[color] || colorMap.blue!

  return (
    <div className={`${c.bg} rounded-xl p-4 border border-gray-100`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${c.iconBg} rounded-lg flex items-center justify-center`}>
          <svg
            className={`w-5 h-5 ${c.text}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
          </svg>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  )
}
