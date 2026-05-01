import { logger } from '@paperweave/shared'
import type { Context, Next } from 'hono'
import type { AppEnv } from '../types.js'

export async function requestLogger(c: Context<AppEnv>, next: Next) {
  const start = Date.now()
  const requestId = c.get('requestId')

  logger.info('Request started', {
    requestId,
    method: c.req.method,
    path: c.req.path,
    userAgent: c.req.header('user-agent'),
  })

  await next()

  const duration = Date.now() - start

  logger.info('Request completed', {
    requestId,
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration: `${duration}ms`,
  })
}
