import { createAuthClient } from 'better-auth/react'
import { env } from '../env'

export const authClient = createAuthClient({
  baseURL: env.VITE_API_URL,
  sessionCookie: true,
})

export const { signIn, signUp, signOut, useSession, getSession } = authClient
