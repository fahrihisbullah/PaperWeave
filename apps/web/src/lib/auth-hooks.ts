import { useContext } from 'react'
import { AuthContext } from './auth-store'

export function useAuth() {
  return useContext(AuthContext)
}

export function useUser() {
  const { session } = useContext(AuthContext)
  return session?.user ?? null
}

export function useIsAuthenticated() {
  const { session } = useContext(AuthContext)
  return !!session?.user
}
