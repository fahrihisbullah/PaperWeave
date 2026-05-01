import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, ApiError } from '../../lib/api'
import { RelationGraph } from '../../components/relation-graph'

interface Paper {
  id: string
  title: string | null
  original_filename: string
  status: string
}

interface Theme {
  id: string
  title: string
  description: string | null
  keywords: string[] | null
  research_gaps: string[] | null
  paper_ids: string[]
}

interface Relation {
  id: string
  source_paper_id: string
  target_paper_id: string
  relation_type: string
  description: string | null
  confidence: string | null
}

interface SynthesisData {
  themes: Theme[]
  relations: Relation[]
}

interface Draft {
  id: string
  title: string
  content_markdown: string
  created_at: string
}

export function SynthesisPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const [papers, setPapers] = useState<Paper[]>([])
  const [synthesis, setSynthesis] = useState<SynthesisData | null>(null)
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false)
  const [error, setError] = useState('')
  const [selectedPaper, setSelectedPaper] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!projectId) return
    try {
      const [papersData, synthData, draftsData] = await Promise.all([
        api.get<Paper[]>(`/api/papers?projectId=${projectId}`),
        api.get<SynthesisData>(`/api/synthesis?projectId=${projectId}`).catch(() => null),
        api.get<Draft[]>(`/api/drafts?projectId=${projectId}`).catch(() => []),
      ])
      setPapers(papersData.filter((p) => p.status === 'completed'))
      if (synthData) setSynthesis(synthData)
      if (draftsData) setDrafts(draftsData)
    } catch (err) {
      console.error('Failed to fetch synthesis data:', err)
    }
  }, [projectId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleGenerateSynthesis = async () => {
    if (!projectId) return
    setIsGenerating(true)
    setError('')
    try {
      await api.post('/api/synthesis/generate', { projectId })
      await fetchData()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to generate synthesis')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateDraft = async () => {
    if (!projectId) return
    setIsGeneratingDraft(true)
    setError('')
    try {
      await api.post('/api/drafts/generate', { projectId })
      await fetchData()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to generate draft')
    } finally {
      setIsGeneratingDraft(false)
    }
  }

  const handleExportDraft = (draftId: string) => {
    window.open(`/api/drafts/${draftId}/export`, '_blank')
  }

  const completedCount = papers.length
  const selectedPaperData = papers.find((p) => p.id === selectedPaper)

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <Link
          to={`/projects/${projectId}`}
          className="text-[15px] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          Back to Project
        </Link>
      </div>

      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-display text-[2.5rem] leading-none tracking-[-0.03em] text-[var(--color-text)]">
          Synthesis & Review
        </h1>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateSynthesis}
            disabled={isGenerating || completedCount < 2}
            className="rounded-xl bg-blue-600 px-4 py-3 text-[15px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isGenerating ? 'Generating...' : 'Generate Synthesis'}
          </button>
          {synthesis && synthesis.themes.length > 0 && (
            <button
              onClick={handleGenerateDraft}
              disabled={isGeneratingDraft}
              className="rounded-xl bg-green-600 px-4 py-3 text-[15px] font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isGeneratingDraft ? 'Drafting...' : 'Generate Draft'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3.5">
          <p className="text-[14px] text-red-700">{error}</p>
        </div>
      )}

      {completedCount < 2 && (
        <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-[15px] text-yellow-800">
            Need at least 2 completed papers to generate synthesis. Currently: {completedCount}{' '}
            completed.
          </p>
        </div>
      )}

      {/* Graph View */}
      {synthesis && synthesis.relations.length > 0 && (
        <div className="mb-6 rounded-[1.5rem] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-[1.35rem] font-semibold">Paper Relations Graph</h2>
          <RelationGraph
            papers={papers}
            relations={synthesis.relations}
            themes={synthesis.themes}
            onNodeSelect={setSelectedPaper}
          />
          {selectedPaperData && (
            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-[15px] font-medium text-blue-800">
                Selected: {selectedPaperData.title || selectedPaperData.original_filename}
              </p>
              <Link
                to={`/projects/${projectId}/papers/${selectedPaperData.id}`}
                className="mt-2 inline-block text-[14px] text-blue-600 hover:underline"
              >
                View paper details
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Themes */}
      {synthesis && synthesis.themes.length > 0 && (
        <div className="mb-6 rounded-[1.5rem] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-[1.35rem] font-semibold">Themes ({synthesis.themes.length})</h2>
          <div className="space-y-4">
            {synthesis.themes.map((theme) => (
              <div key={theme.id} className="rounded-xl border p-5">
                <h3 className="text-[18px] font-medium text-gray-900">{theme.title}</h3>
                {theme.description && (
                  <p className="mt-2 text-[15px] leading-relaxed text-gray-600">
                    {theme.description}
                  </p>
                )}
                {theme.keywords && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(theme.keywords as string[]).map((kw, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-gray-100 px-2.5 py-1 text-[13px] text-gray-600"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
                {theme.research_gaps && (theme.research_gaps as string[]).length > 0 && (
                  <div className="mt-2">
                    <p className="text-[13px] font-semibold uppercase tracking-[0.04em] text-orange-700">
                      Research Gaps
                    </p>
                    <ul className="mt-1 list-inside list-disc text-[14px] leading-relaxed text-orange-600">
                      {(theme.research_gaps as string[]).map((gap, i) => (
                        <li key={i}>{gap}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="mt-3 text-[13px] text-gray-400">{theme.paper_ids.length} paper(s)</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drafts */}
      {drafts.length > 0 && (
        <div className="rounded-[1.5rem] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-[1.35rem] font-semibold">Literature Review Drafts</h2>
          <div className="space-y-3">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="flex items-start justify-between rounded-xl border p-4"
              >
                <div>
                  <h3 className="text-[17px] font-medium text-gray-900">{draft.title}</h3>
                  <p className="mt-1 text-[13px] text-gray-500">
                    Generated {new Date(draft.created_at).toLocaleString()}
                  </p>
                  <p className="mt-1 text-[13px] text-gray-400">
                    {draft.content_markdown.length} characters
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/projects/${projectId}/drafts/${draft.id}`}
                    className="rounded-lg bg-gray-100 px-3.5 py-2 text-[14px] text-gray-700 hover:bg-gray-200"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleExportDraft(draft.id)}
                    className="rounded-lg bg-blue-100 px-3.5 py-2 text-[14px] text-blue-700 hover:bg-blue-200"
                  >
                    Export .md
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!synthesis && completedCount >= 2 && (
        <div className="rounded-[1.5rem] bg-white p-8 text-center shadow-sm">
          <p className="mb-4 text-[1.02rem] text-gray-500">No synthesis generated yet.</p>
          <p className="text-[15px] text-gray-400">
            Click "Generate Synthesis" to analyze relationships between your papers.
          </p>
        </div>
      )}
    </div>
  )
}
