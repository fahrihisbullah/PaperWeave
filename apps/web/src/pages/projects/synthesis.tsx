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
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link to={`/projects/${projectId}`} className="text-gray-600 hover:text-gray-800 text-sm">
          &larr; Back to Project
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Synthesis & Review</h1>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateSynthesis}
            disabled={isGenerating || completedCount < 2}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isGenerating ? 'Generating...' : 'Generate Synthesis'}
          </button>
          {synthesis && synthesis.themes.length > 0 && (
            <button
              onClick={handleGenerateDraft}
              disabled={isGeneratingDraft}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isGeneratingDraft ? 'Drafting...' : 'Generate Draft'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {completedCount < 2 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            Need at least 2 completed papers to generate synthesis. Currently: {completedCount}{' '}
            completed.
          </p>
        </div>
      )}

      {/* Graph View */}
      {synthesis && synthesis.relations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Paper Relations Graph</h2>
          <RelationGraph
            papers={papers}
            relations={synthesis.relations}
            themes={synthesis.themes}
            onNodeSelect={setSelectedPaper}
          />
          {selectedPaperData && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm font-medium text-blue-800">
                Selected: {selectedPaperData.title || selectedPaperData.original_filename}
              </p>
              <Link
                to={`/projects/${projectId}/papers/${selectedPaperData.id}`}
                className="text-xs text-blue-600 hover:underline"
              >
                View paper details →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Themes */}
      {synthesis && synthesis.themes.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Themes ({synthesis.themes.length})</h2>
          <div className="space-y-4">
            {synthesis.themes.map((theme) => (
              <div key={theme.id} className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900">{theme.title}</h3>
                {theme.description && (
                  <p className="text-sm text-gray-600 mt-1">{theme.description}</p>
                )}
                {theme.keywords && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(theme.keywords as string[]).map((kw, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
                {theme.research_gaps && (theme.research_gaps as string[]).length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-orange-700">Research Gaps:</p>
                    <ul className="list-disc list-inside text-xs text-orange-600 mt-1">
                      {(theme.research_gaps as string[]).map((gap, i) => (
                        <li key={i}>{gap}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-2">{theme.paper_ids.length} paper(s)</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drafts */}
      {drafts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Literature Review Drafts</h2>
          <div className="space-y-3">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="border rounded-lg p-4 flex justify-between items-start"
              >
                <div>
                  <h3 className="font-medium text-gray-900 text-sm">{draft.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Generated {new Date(draft.created_at).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {draft.content_markdown.length} characters
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/projects/${projectId}/drafts/${draft.id}`}
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleExportDraft(draft.id)}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
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
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">No synthesis generated yet.</p>
          <p className="text-sm text-gray-400">
            Click "Generate Synthesis" to analyze relationships between your papers.
          </p>
        </div>
      )}
    </div>
  )
}
