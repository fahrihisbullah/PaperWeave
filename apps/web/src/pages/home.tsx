import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth-hooks'

export function HomePage() {
  const { session, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Redirect authenticated users to projects
  if (session) {
    return <Navigate to="/projects" replace />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
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
          </div>
          <span className="text-white text-lg font-bold">PaperWeave</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-3xl text-center">
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
            Your AI-Powered
            <br />
            <span className="text-blue-400">Literature Review</span> Workspace
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Upload papers, extract insights, discover connections, and generate structured
            literature reviews — all powered by AI.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25"
            >
              Start Free
            </Link>
            <Link
              to="/login"
              className="px-8 py-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-colors border border-white/20"
            >
              Sign In
            </Link>
          </div>

          {/* Features */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <FeatureCard
              icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              title="Smart Extraction"
              description="Upload PDFs and automatically extract text, metadata, and key insights."
            />
            <FeatureCard
              icon="M13 10V3L4 14h7v7l9-11h-7z"
              title="Cross-Paper Synthesis"
              description="Discover themes, relationships, and research gaps across your papers."
            />
            <FeatureCard
              icon="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              title="Draft Generation"
              description="Generate structured literature review drafts ready for editing and export."
            />
          </div>
        </div>
      </main>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div className="p-5 rounded-xl bg-white/5 border border-white/10">
      <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center mb-3">
        <svg
          className="w-5 h-5 text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
        </svg>
      </div>
      <h3 className="text-white font-medium mb-1">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  )
}
