import { env } from '../env'

const API_BASE = env.VITE_API_URL

interface ApiResponse<T> {
  success: boolean
  data: T | null
  error: {
    code: string
    message: string
    details?: unknown
  } | null
  requestId: string
}

class ApiError extends Error {
  code: string
  details?: unknown

  constructor(code: string, message: string, details?: unknown) {
    super(message)
    this.code = code
    this.details = details
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  })

  const result: ApiResponse<T> = await response.json()

  if (!result.success || !result.data) {
    throw new ApiError(
      result.error?.code || 'UNKNOWN_ERROR',
      result.error?.message || 'An error occurred',
      result.error?.details
    )
  }

  return result.data
}

async function uploadRequest<T>(path: string, formData: FormData): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
    // Don't set Content-Type header - browser will set it with boundary for multipart
  })

  const result: ApiResponse<T> = await response.json()

  if (!result.success || !result.data) {
    throw new ApiError(
      result.error?.code || 'UNKNOWN_ERROR',
      result.error?.message || 'An error occurred',
      result.error?.details
    )
  }

  return result.data
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(path: string, data: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(data) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, formData: FormData) => uploadRequest<T>(path, formData),
}

export { ApiError }
