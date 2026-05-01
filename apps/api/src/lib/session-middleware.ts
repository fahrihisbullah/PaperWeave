import type { MiddlewareHandler } from 'hono'
import { auth } from '../index.js'
import type { AppEnv } from '../types.js'

export const sessionMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const sessionToken = c.req.header('cookie')?.split(';')?.find(c => c.trim().startsWith('better-auth.session_token='))?.split('=')[1]
  
  if (sessionToken) {
    try {
      const session = await auth.api.getSession({
        headers: {
          cookie: c.req.header('cookie') || '',
        },
      })
      
      if (session?.user) {
        c.set('user', {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
        })
      }
    } catch {
      // Invalid session, continue without user
    }
  }
  
  await next()
}
