import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth, useIsAuthenticated } from './auth-hooks'

interface ProtectedRouteProps {
  children: ReactNode
  redirectTo?: string
}

export function ProtectedRoute({ children, redirectTo = '/login' }: ProtectedRouteProps) {
  const { isLoading } = useAuth()
  const isAuthenticated = useIsAuthenticated()

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}

export function PublicRoute({ children, redirectTo = '/' }: ProtectedRouteProps) {
  const { isLoading } = useAuth()
  const isAuthenticated = useIsAuthenticated()

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}
