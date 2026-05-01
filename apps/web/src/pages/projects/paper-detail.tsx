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
      className={`px-2 py-0.5 text-xs rounded-full ${colors[confidence] || 'bg-gray-100 text-gray-800'}`}
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
      // Refresh paper to see status change
      await fetchPaper()
    } catch (err) {
      setAnalysisError(err instanceof ApiError ? err.message : 'Failed to trigger analysis')
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
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-red-600 mb-4">{error || 'Paper not found'}</p>
          <Link to={`/projects/${projectId}`} className="text-blue-600 hover:text-blue-800">
            Back to Project
          </Link>
        </div>
      </div>
    )
  }

  const isProcessing = ['queued', 'extracting', 'summarizing'].includes(paper.status)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to={`/projects/${projectId}`} className="text-gray-600 hover:text-gray-800 text-sm">
          &larr; Back to Project
        </Link>
      </div>

      {/* Paper Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{paper.title || paper.original_filename}</h1>
            <p className="text-sm text-gray-500 mt-1">
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
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isAnalyzing ? 'Starting...' : 'Analyze'}
              </button>
            )}
          </div>
        </div>

        {isProcessing && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center gap-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <p className="text-sm text-blue-700">Analysis in progress: {paper.status}...</p>
          </div>
        )}

        {paper.status === 'failed' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">Analysis failed. You can try again.</p>
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
            >
              Retry Analysis
            </button>
          </div>
        )}

        {analysisError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{analysisError}</p>
          </div>
        )}
      </div>

      {/* Insight Summary */}
      {insight && (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Summary</h2>

            {insight.summary_markdown && (
              <div className="prose prose-sm max-w-none text-gray-700 mb-6 whitespace-pre-wrap">
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
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Key Findings</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  {insight.key_findings.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}

            {insight.limitations && insight.limitations.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Limitations</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
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
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}

            <p className="mt-4 text-xs text-gray-400">
              Generated by {insight.model_provider}/{insight.model_name}
            </p>
          </div>

          {/* Evidence */}
          {evidence.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Evidence ({evidence.length})</h2>
              <div className="space-y-4">
                {evidence.map((ev) => (
                  <div key={ev.id} className="border-l-4 border-blue-300 pl-4 py-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {ev.insight_field}
                      </span>
                      <ConfidenceBadge confidence={ev.confidence} />
                      <span className="text-xs text-gray-400">p.{ev.page}</span>
                    </div>
                    <blockquote className="text-sm text-gray-700 italic">
                      &ldquo;{ev.quote}&rdquo;
                    </blockquote>
                    {ev.explanation && (
                      <p className="text-xs text-gray-500 mt-1">{ev.explanation}</p>
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
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No insights generated yet.</p>
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
      className={`px-3 py-1 text-sm rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}
    >
      {status}
    </span>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-gray-50 rounded-md">
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-sm text-gray-800">{value}</p>
    </div>
  )
}
