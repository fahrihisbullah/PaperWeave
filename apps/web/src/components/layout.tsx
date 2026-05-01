import { Link, useLocation } from 'react-router-dom'
import { useUser } from '../lib/auth-hooks'

interface LayoutProps {
  children: React.ReactNode
}

const NAV_ITEMS = [{ path: '/projects', label: 'Projects', icon: FolderIcon }]

export function Layout({ children }: LayoutProps) {
  const user = useUser()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col fixed h-full">
        {/* Logo */}
        <div className="p-5 border-b border-gray-700">
          <Link to="/projects" className="flex items-center gap-2">
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
            <span className="text-lg font-bold">PaperWeave</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname.startsWith(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <item.icon />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-xs font-medium">
              {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <Link
            to="/logout"
            className="mt-3 block text-xs text-gray-400 hover:text-red-400 transition-colors"
          >
            Sign out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}

function FolderIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
      />
    </svg>
  )
}
