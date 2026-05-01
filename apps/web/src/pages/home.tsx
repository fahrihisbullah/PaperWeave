import { Link } from 'react-router-dom'
import { useAuth, useUser } from '../lib/auth-hooks'

export function HomePage() {
  const { session, isLoading } = useAuth()
  const user = useUser()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!session || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">PaperWeave</h1>
          <p className="text-gray-600 mb-6">Literature Review Workspace</p>
          <div className="space-x-4">
            <Link
              to="/login"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">PaperWeave</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <Link
              to="/logout"
              className="text-sm text-red-600 hover:text-red-800"
            >
              Sign Out
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">My Projects</h2>
          <Link
            to="/projects/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            New Project
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-center">
            No projects yet. Create your first project to get started.
          </p>
        </div>
      </main>
    </div>
  )
}
