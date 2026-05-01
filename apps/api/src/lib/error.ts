import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { AppEnv } from '../types.js'

export function errorResponse(
  c: Context<AppEnv>,
  status: ContentfulStatusCode,
  code: string,
  message: string,
  details?: unknown
) {
  return c.json(
    {
      success: false,
      data: null,
      error: { code, message, details },
      requestId: c.get('requestId'),
    },
    { status }
  )
}

export function notFoundError(c: Context<AppEnv>, message?: string) {
  return errorResponse(c, 404, 'NOT_FOUND', message ?? `Route ${c.req.path} not found`)
}

export function badRequestError(c: Context<AppEnv>, message: string, details?: unknown) {
  return errorResponse(c, 400, 'BAD_REQUEST', message, details)
}

export function unauthorizedError(c: Context<AppEnv>, message = 'Unauthorized') {
  return errorResponse(c, 401, 'UNAUTHORIZED', message)
}

export function forbiddenError(c: Context<AppEnv>, message = 'Forbidden') {
  return errorResponse(c, 403, 'FORBIDDEN', message)
}

export function notFoundException(message?: string) {
  return new HTTPException(404, { message })
}

export function badRequestException(message: string) {
  return new HTTPException(400, { message })
}

export function unauthorizedException(message = 'Unauthorized') {
  return new HTTPException(401, { message })
}

export function forbiddenException(message = 'Forbidden') {
  return new HTTPException(403, { message })
}
