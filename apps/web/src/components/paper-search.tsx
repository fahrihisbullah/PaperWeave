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
    <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <h3 className="mb-1.5 text-[1.2rem] font-semibold text-[var(--color-text)]">
        Ask Your Papers
      </h3>
      <p className="mb-5 text-[14px] leading-relaxed text-[var(--color-text-faint)]">
        Get AI answers with citations from your research
      </p>

      <form onSubmit={handleAsk} className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. What methods are commonly used for..."
          className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[15px] text-[var(--color-text)] transition-all focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
          disabled={isAsking}
        />
        <button
          type="submit"
          disabled={isAsking || !question.trim()}
          className="whitespace-nowrap rounded-xl bg-[var(--color-primary)] px-4 py-3 text-[15px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isAsking ? 'Thinking...' : 'Ask'}
        </button>
      </form>

      {error && <p className="mt-3 text-[14px] text-red-600">{error}</p>}

      {result && (
        <div className="mt-5">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
            <p className="whitespace-pre-wrap text-[15px] leading-[1.75] text-[var(--color-text)]">
              {result.answer}
            </p>
          </div>

          {result.sources.length > 0 && (
            <div className="mt-3">
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
                Sources
              </p>
              <div className="space-y-1">
                {result.sources.map((source, i) => (
                  <div key={i} className="flex items-center gap-2 text-[13px]">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-[var(--color-primary-bg)] text-[11px] font-semibold text-[var(--color-primary)]">
                      {i + 1}
                    </span>
                    <span className="font-medium text-[var(--color-text-muted)]">
                      {source.paper_title}
                    </span>
                    <span className="text-[var(--color-text-faint)]">p.{source.page_start}</span>
                    <span className="text-[var(--color-text-faint)]">
                      {(source.similarity * 100).toFixed(0)}%
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
