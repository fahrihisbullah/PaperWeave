import type { ReactNode } from 'react'
import { useSession } from './auth-client'
import { AuthContext } from './auth-store'

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending: isLoading } = useSession()

  return <AuthContext.Provider value={{ session, isLoading }}>{children}</AuthContext.Provider>
}
