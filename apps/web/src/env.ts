const fallbackApiUrl = 'http://localhost:3000'

const apiUrl = import.meta.env.VITE_API_URL || fallbackApiUrl

try {
  new URL(apiUrl)
} catch {
  throw new Error(`Invalid VITE_API_URL: ${apiUrl}`)
}

export const env = {
  VITE_API_URL: apiUrl,
  VITE_APP_TITLE: import.meta.env.VITE_APP_TITLE || 'PaperWeave',
} as const
