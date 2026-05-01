export * from './schema/index.js'
export * from './env.js'
export * from './logger.js'

export function createApiResponse<T>(data: T, requestId: string) {
  return {
    success: true,
    data,
    error: null,
    requestId,
  }
}

export function createApiError(
  code: string,
  message: string,
  requestId: string,
  details?: unknown
) {
  return {
    success: false,
    data: null,
    error: { code, message, details },
    requestId,
  }
}

export function getStoragePath(userId: string, projectId: string, paperId: string, filename: string) {
  return `users/${userId}/projects/${projectId}/papers/${paperId}/${filename}`
}
