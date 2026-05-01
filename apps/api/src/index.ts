import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import type { AppEnv } from './types.js'
import { db } from './db/index.js'
import { account, session, user, verification } from './db/auth-schema.js'
import { env } from './env.js'
import { requestLogger } from './lib/logger.js'
import { errorResponse, notFoundError } from './lib/error.js'
import { projectsRouter } from './routes/projects.js'
import { papersRouter } from './routes/papers.js'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  secret: env.AUTH_SECRET,
  baseURL: env.API_URL,
})

const app = new Hono<AppEnv>()

app.use('*', async (c, next) => {
  c.set('requestId', crypto.randomUUID())
  c.set('user', null)

  const cookieHeader = c.req.header('cookie')
  if (cookieHeader) {
    try {
      const session = await auth.api.getSession({
        headers: { cookie: cookieHeader },
      })
      if (session?.user) {
        c.set('user', {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name ?? null,
        })
      }
    } catch {
      // Invalid session
    }
  }

  await next()
})

app.use('*', requestLogger)

app.use(
  '/api/*',
  cors({
    origin: ['http://localhost:5173'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
)

app.get('/', (c) => {
  return c.json({ message: 'PaperWeave API', version: '1.0.0' })
})

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.on(['GET', 'POST'], '/api/auth/*', async (c) => {
  try {
    const response = await auth.handler(c.req.raw)
    return response
  } catch (err) {
    console.error('Auth handler error:', err)
    return c.json({ error: 'Auth handler failed', message: String(err) }, 500)
  }
})
app.route('/api/projects', projectsRouter)
app.route('/api/papers', papersRouter)

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse()
  }
  console.error('Unhandled error:', err)
  return errorResponse(c, 500, 'INTERNAL_ERROR', err.message)
})

app.notFound((c) => {
  return notFoundError(c)
})

export default app

serve(
  {
    fetch: app.fetch,
    port: Number(env.API_PORT),
  },
  ({ port }: { port: number }) => {
    console.log(`PaperWeave API listening on http://localhost:${port}`)
  }
)
