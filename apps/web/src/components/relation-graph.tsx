import { useCallback, useMemo, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  Position,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

interface Paper {
  id: string
  title: string | null
  original_filename: string
  status: string
}

interface Relation {
  id: string
  source_paper_id: string
  target_paper_id: string
  relation_type: string
  description: string | null
  confidence: string | null
}

interface Theme {
  id: string
  title: string
  paper_ids: string[]
}

interface RelationGraphProps {
  papers: Paper[]
  relations: Relation[]
  themes: Theme[]
  onNodeSelect?: (paperId: string) => void
}

const RELATION_COLORS: Record<string, string> = {
  supports: '#22c55e',
  contradicts: '#ef4444',
  extends: '#3b82f6',
  uses_method_of: '#8b5cf6',
  shares_dataset: '#f59e0b',
  cites: '#6b7280',
  related: '#94a3b8',
}

const THEME_COLORS = ['#dbeafe', '#dcfce7', '#fef3c7', '#fce7f3', '#e0e7ff', '#f3e8ff']

export function RelationGraph({ papers, relations, themes, onNodeSelect }: RelationGraphProps) {
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null)

  const { nodes, edges } = useMemo(() => {
    // Position papers in a circle
    const radius = Math.max(200, papers.length * 50)
    const angleStep = (2 * Math.PI) / papers.length

    const graphNodes: Node[] = papers.map((paper, i) => {
      const angle = i * angleStep - Math.PI / 2
      const x = radius * Math.cos(angle) + radius + 100
      const y = radius * Math.sin(angle) + radius + 100

      // Find which theme this paper belongs to
      const paperThemeIdx = themes.findIndex((t) => t.paper_ids.includes(paper.id))
      const bgColor =
        paperThemeIdx >= 0 ? THEME_COLORS[paperThemeIdx % THEME_COLORS.length] : '#f9fafb'

      const isFiltered =
        selectedTheme && !themes.find((t) => t.id === selectedTheme)?.paper_ids.includes(paper.id)

      return {
        id: paper.id,
        position: { x, y },
        data: { label: paper.title || paper.original_filename },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        style: {
          background: bgColor,
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '13px',
          maxWidth: '190px',
          opacity: isFiltered ? 0.3 : 1,
        },
      }
    })

    const graphEdges: Edge[] = relations
      .filter((rel) => {
        if (!selectedTheme) return true
        const themeP = themes.find((t) => t.id === selectedTheme)?.paper_ids || []
        return themeP.includes(rel.source_paper_id) || themeP.includes(rel.target_paper_id)
      })
      .map((rel) => ({
        id: rel.id,
        source: rel.source_paper_id,
        target: rel.target_paper_id,
        label: rel.relation_type,
        style: { stroke: RELATION_COLORS[rel.relation_type] || '#94a3b8' },
        labelStyle: { fontSize: '11px', fill: '#6b7280' },
        animated: rel.relation_type === 'contradicts',
      }))

    return { nodes: graphNodes, edges: graphEdges }
  }, [papers, relations, themes, selectedTheme])

  const [graphNodes, , onNodesChange] = useNodesState(nodes)
  const [graphEdges, , onEdgesChange] = useEdgesState(edges)

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeSelect?.(node.id)
    },
    [onNodeSelect]
  )

  return (
    <div className="space-y-3">
      {/* Theme Filter */}
      {themes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedTheme(null)}
            className={`rounded-full border px-3 py-1.5 text-[14px] ${!selectedTheme ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            All
          </button>
          {themes.map((theme, i) => (
            <button
              key={theme.id}
              onClick={() => setSelectedTheme(theme.id === selectedTheme ? null : theme.id)}
              className={`rounded-full border px-3 py-1.5 text-[14px] ${selectedTheme === theme.id ? 'bg-gray-800 text-white' : 'hover:bg-gray-100'}`}
              style={{ borderColor: THEME_COLORS[i % THEME_COLORS.length] }}
            >
              {theme.title}
            </button>
          ))}
        </div>
      )}

      {/* Graph */}
      <div className="h-[500px] border rounded-lg bg-white">
        <ReactFlow
          nodes={graphNodes}
          edges={graphEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          fitView
          fitViewOptions={{ padding: 0.3 }}
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[14px] text-gray-600">
        {Object.entries(RELATION_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1">
            <div className="w-3 h-0.5" style={{ backgroundColor: color }}></div>
            <span>{type}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
