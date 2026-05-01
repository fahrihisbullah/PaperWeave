import { createContext } from 'react'
import type { useSession } from './auth-client'

type Session = ReturnType<typeof useSession>['data']

export interface AuthContextValue {
  session: Session | null
  isLoading: boolean
}

export const AuthContext = createContext<AuthContextValue>({
  session: null,
  isLoading: true,
})
