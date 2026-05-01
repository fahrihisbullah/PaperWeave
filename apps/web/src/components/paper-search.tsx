import { useState } from 'react'
import { api, ApiError } from '../lib/api'

interface Source {
  paper_title: string
  page_start: number
  page_end: number
  similarity: number
}

interface AskResult {
  answer: string
  sources: Source[]
}

interface PaperSearchProps {
  projectId: string
}

export function PaperSearch({ projectId }: PaperSearchProps) {
  const [question, setQuestion] = useState('')
  const [isAsking, setIsAsking] = useState(false)
  const [result, setResult] = useState<AskResult | null>(null)
  const [error, setError] = useState('')

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return

    setIsAsking(true)
    setError('')
    setResult(null)

    try {
      const data = await api.post<AskResult>('/api/search/ask', {
        projectId,
        question: question.trim(),
      })
      setResult(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to get answer')
    } finally {
      setIsAsking(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Ask Your Papers</h3>
      <p className="text-sm text-gray-500 mb-4">
        Ask questions and get AI-powered answers based on your uploaded papers.
      </p>

      <form onSubmit={handleAsk} className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. What methods are commonly used for..."
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isAsking}
        />
        <button
          type="submit"
          disabled={isAsking || !question.trim()}
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {isAsking ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></span>
              Thinking...
            </span>
          ) : (
            'Ask'
          )}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-5 space-y-4">
          {/* Answer */}
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
              {result.answer}
            </p>
          </div>

          {/* Sources */}
          {result.sources.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Sources</p>
              <div className="space-y-1.5">
                {result.sources.map((source, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center text-[10px] font-medium">
                      {i + 1}
                    </span>
                    <span className="font-medium">{source.paper_title}</span>
                    <span className="text-gray-400">
                      p.{source.page_start}
                      {source.page_start !== source.page_end ? `-${source.page_end}` : ''}
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="text-gray-400">
                      {(source.similarity * 100).toFixed(0)}% match
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
