import { Link, useLocation } from 'react-router-dom'
import { useUser } from '../lib/auth-hooks'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const user = useUser()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Topbar — 56px */}
      <header className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6">
        <Link to="/projects" className="flex items-center gap-2.5 mr-10">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)]"></span>
          <span className="font-display text-[1.5rem] leading-none">PaperWeave</span>
        </Link>

        {/* Avatar */}
        <div className="ml-auto flex items-center gap-4">
          <span className="hidden text-[15px] text-[var(--color-text-muted)] md:block">
            {user?.name || user?.email}
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary-bg)] text-[13px] font-semibold text-[var(--color-primary)]">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
        </div>
      </header>

      {/* Sidebar — 220px */}
      <aside className="fixed bottom-0 left-0 top-16 w-[232px] overflow-y-auto border-r border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-5">
        <p className="mb-2 px-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-faint)]">
          Workspace
        </p>
        <nav className="space-y-0.5">
          <SidebarItem
            to="/projects"
            icon={<FolderIcon />}
            label="Projects"
            active={location.pathname.startsWith('/projects')}
          />
        </nav>

        {/* Bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-[var(--color-border)] p-4">
          <Link
            to="/logout"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[15px] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
          >
            <LogoutIcon />
            Sign out
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-[232px] pt-16">
        <div className="w-full px-10 py-10">{children}</div>
      </main>
    </div>
  )
}

function SidebarItem({
  to,
  icon,
  label,
  active,
}: {
  to: string
  icon: React.ReactNode
  label: string
  active: boolean
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors ${
        active
          ? 'bg-[var(--color-primary-bg)] text-[var(--color-primary)]'
          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)]'
      }`}
    >
      {icon}
      {label}
    </Link>
  )
}

function FolderIcon() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
      />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  )
}
