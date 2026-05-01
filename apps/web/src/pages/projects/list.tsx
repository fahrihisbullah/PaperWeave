import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../../lib/api'
import type { Project } from '@paperweave/shared'

export function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const data = await api.get<Project[]>('/api/projects')
      setProjects(data)
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-500">Loading projects...</p>
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
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Projects</h1>
        <Link
          to="/projects/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 mb-4">
            No projects yet. Create your first project to get started.
          </p>
          <Link
            to="/projects/new"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Project
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="block bg-white rounded-lg shadow hover:shadow-md transition p-4"
            >
              <h2 className="text-lg font-semibold">{project.title}</h2>
              {project.description && (
                <p className="text-gray-600 text-sm mt-1">{project.description}</p>
              )}
                  <p className="text-xs text-gray-400 mt-2">
                    Created {new Date(project.created_at).toLocaleDateString()}
                  </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
