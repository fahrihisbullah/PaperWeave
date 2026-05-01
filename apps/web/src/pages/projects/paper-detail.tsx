import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, ApiError } from '../../lib/api'

interface Paper {
  id: string
  project_id: string
  title: string | null
  original_filename: string
  status: string
  total_pages: number | null
  file_size_bytes: number
  created_at: string
}

interface Insight {
  id: string
  title: string | null
  authors: string[] | null
  publication_year: number | null
  research_problem: string | null
  method: string | null
  dataset_or_object: string | null
  key_findings: string[] | null
  limitations: string[] | null
  keywords: string[] | null
  summary_markdown: string | null
  model_provider: string
  model_name: string
  created_at: string
}

interface Evidence {
  id: string
  insight_field: string
  claim_label: string | null
  quote: string
  page: number
  confidence: 'low' | 'medium' | 'high'
  explanation: string | null
}

interface AnalysisJob {
  id: string
  status: string
  current_step: string | null
  last_error: string | null
  created_at: string
}

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const colors: Record<string, string> = {
    high: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-red-100 text-red-800',
  }
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${colors[confidence] || 'bg-gray-100 text-gray-800'}`}
    >
      {confidence}
    </span>
  )
}

export function PaperDetailPage() {
  const { id: projectId, paperId } = useParams<{ id: string; paperId: string }>()
  const [paper, setPaper] = useState<Paper | null>(null)
  const [insight, setInsight] = useState<Insight | null>(null)
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState('')
  const [error, setError] = useState('')

  const fetchPaper = useCallback(async () => {
    if (!paperId) return
    try {
      const data = await api.get<Paper>(`/api/papers/${paperId}`)
      setPaper(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to fetch paper')
    } finally {
      setIsLoading(false)
    }
  }, [paperId])

  const fetchInsights = useCallback(async () => {
    if (!paperId) return
    try {
      const insights = await api.get<Insight[]>(`/api/analysis/insights?paperId=${paperId}`)
      if (insights.length > 0) {
        const latestInsight = insights[0]!
        setInsight(latestInsight)
        // Fetch evidence for this insight
        const ev = await api.get<Evidence[]>(`/api/analysis/evidence?insightId=${latestInsight.id}`)
        setEvidence(ev)
      }
    } catch {
      // No insights yet, that's fine
    }
  }, [paperId])

  useEffect(() => {
    fetchPaper()
    fetchInsights()
  }, [fetchPaper, fetchInsights])

  // Poll for analysis status if paper is being processed
  const paperStatus = paper?.status
  useEffect(() => {
    if (!paperStatus || !['queued', 'extracting', 'summarizing'].includes(paperStatus)) return

    const interval = setInterval(async () => {
      await fetchPaper()
      await fetchInsights()
    }, 3000)

    return () => clearInterval(interval)
  }, [paperStatus, fetchPaper, fetchInsights])

  const handleAnalyze = async () => {
    if (!paperId) return
    setIsAnalyzing(true)
    setAnalysisError('')

    try {
      await api.post<AnalysisJob>('/api/analysis/trigger', { paperId })
      await fetchPaper()
    } catch (err) {
      setAnalysisError(err instanceof ApiError ? err.message : 'Failed to trigger analysis')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleRetry = async () => {
    if (!paperId) return
    setIsAnalyzing(true)
    setAnalysisError('')

    try {
      await api.post<AnalysisJob>('/api/analysis/retry', { paperId })
      await fetchPaper()
    } catch (err) {
      setAnalysisError(err instanceof ApiError ? err.message : 'Failed to retry analysis')
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (error || !paper) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="rounded-[1.5rem] bg-white p-6 text-center shadow-sm">
          <p className="mb-4 text-[15px] text-red-600">{error || 'Paper not found'}</p>
          <Link
            to={`/projects/${projectId}`}
            className="text-[15px] text-blue-600 hover:text-blue-800"
          >
            Back to Project
          </Link>
        </div>
      </div>
    )
  }

  const isProcessing = ['queued', 'extracting', 'summarizing'].includes(paper.status)

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Link
          to={`/projects/${projectId}`}
          className="text-[15px] text-gray-600 hover:text-gray-800"
        >
          Back to Project
        </Link>
      </div>

      {/* Paper Header */}
      <div className="mb-6 rounded-[1.5rem] bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[2rem] font-semibold leading-tight">
              {paper.title || paper.original_filename}
            </h1>
            <p className="mt-2 text-[15px] text-gray-500">
              {paper.total_pages ? `${paper.total_pages} pages` : ''}
              {paper.total_pages ? ' · ' : ''}
              {(paper.file_size_bytes / 1024).toFixed(0)} KB
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={paper.status} />
            {paper.status === 'uploaded' && (
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="rounded-xl bg-blue-600 px-4 py-3 text-[15px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isAnalyzing ? 'Starting...' : 'Analyze'}
              </button>
            )}
          </div>
        </div>

        {isProcessing && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3.5">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <p className="text-[15px] text-blue-700">Analysis in progress: {paper.status}...</p>
          </div>
        )}

        {paper.status === 'failed' && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5">
            <p className="text-[15px] font-semibold text-red-700">Analysis failed</p>
            <p className="mt-1 text-[14px] text-red-600">
              You can retry the analysis. Previous data will be cleaned up automatically.
            </p>
            <button
              onClick={handleRetry}
              disabled={isAnalyzing}
              className="mt-3 rounded-lg bg-red-600 px-3.5 py-2 text-[14px] font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isAnalyzing ? 'Retrying...' : 'Retry Analysis'}
            </button>
          </div>
        )}

        {analysisError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5">
            <p className="text-[14px] text-red-700">{analysisError}</p>
          </div>
        )}
      </div>

      {/* Insight Summary */}
      {insight && (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="rounded-[1.5rem] bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-[1.45rem] font-semibold">Summary</h2>

            {insight.summary_markdown && (
              <div className="prose prose-base mb-6 max-w-none whitespace-pre-wrap text-gray-700">
                {insight.summary_markdown}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insight.research_problem && (
                <InfoCard label="Research Problem" value={insight.research_problem} />
              )}
              {insight.method && <InfoCard label="Method" value={insight.method} />}
              {insight.dataset_or_object && (
                <InfoCard label="Dataset / Object" value={insight.dataset_or_object} />
              )}
              {insight.publication_year && (
                <InfoCard label="Year" value={String(insight.publication_year)} />
              )}
            </div>

            {insight.key_findings && insight.key_findings.length > 0 && (
              <div className="mt-4">
                <h3 className="mb-2 text-[16px] font-semibold text-gray-700">Key Findings</h3>
                <ul className="list-inside list-disc space-y-1 text-[15px] leading-relaxed text-gray-600">
                  {insight.key_findings.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}

            {insight.limitations && insight.limitations.length > 0 && (
              <div className="mt-4">
                <h3 className="mb-2 text-[16px] font-semibold text-gray-700">Limitations</h3>
                <ul className="list-inside list-disc space-y-1 text-[15px] leading-relaxed text-gray-600">
                  {insight.limitations.map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
              </div>
            )}

            {insight.keywords && insight.keywords.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {insight.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-gray-100 px-2.5 py-1 text-[13px] text-gray-700"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}

            <p className="mt-4 text-[13px] text-gray-400">
              Generated by {insight.model_provider}/{insight.model_name}
            </p>
          </div>

          {/* Evidence */}
          {evidence.length > 0 && (
            <div className="rounded-[1.5rem] bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-[1.45rem] font-semibold">Evidence ({evidence.length})</h2>
              <div className="space-y-4">
                {evidence.map((ev) => (
                  <div key={ev.id} className="border-l-4 border-blue-300 pl-4 py-2">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded bg-blue-50 px-2 py-1 text-[12px] font-semibold text-blue-700">
                        {ev.insight_field}
                      </span>
                      <ConfidenceBadge confidence={ev.confidence} />
                      <span className="text-[12px] text-gray-400">p.{ev.page}</span>
                    </div>
                    <blockquote className="text-[15px] italic leading-relaxed text-gray-700">
                      &ldquo;{ev.quote}&rdquo;
                    </blockquote>
                    {ev.explanation && (
                      <p className="mt-1 text-[14px] text-gray-500">{ev.explanation}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No insight yet and paper is completed but no insight */}
      {!insight && paper.status === 'completed' && (
        <div className="rounded-[1.5rem] bg-white p-6 text-center shadow-sm">
          <p className="text-[15px] text-gray-500">No insights generated yet.</p>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    uploaded: 'bg-blue-100 text-blue-800',
    queued: 'bg-yellow-100 text-yellow-800',
    extracting: 'bg-purple-100 text-purple-800',
    summarizing: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  }
  return (
    <span
      className={`rounded-full px-3 py-1.5 text-[14px] font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}
    >
      {status}
    </span>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <p className="mb-1 text-[13px] font-semibold uppercase tracking-[0.04em] text-gray-500">
        {label}
      </p>
      <p className="text-[15px] leading-relaxed text-gray-800">{value}</p>
    </div>
  )
}
