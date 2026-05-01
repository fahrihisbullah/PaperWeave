import { z } from 'zod'

export const SYNTHESIS_PROMPT_VERSION = '1.0.0'

export const synthesisOutputSchema = z.object({
  themes: z
    .array(
      z.object({
        title: z.string().describe('Theme title'),
        description: z.string().describe('Theme description (1-2 sentences)'),
        keywords: z.array(z.string()).describe('Keywords for this theme'),
        paper_indices: z
          .array(z.number().int())
          .describe('Indices of papers belonging to this theme (0-based)'),
        research_gaps: z
          .array(z.string())
          .nullable()
          .describe('Research gaps identified in this theme'),
      })
    )
    .describe('Thematic clusters found across papers'),
  relations: z
    .array(
      z.object({
        source_index: z.number().int().describe('Index of source paper (0-based)'),
        target_index: z.number().int().describe('Index of target paper (0-based)'),
        relation_type: z
          .enum([
            'supports',
            'contradicts',
            'extends',
            'uses_method_of',
            'shares_dataset',
            'cites',
            'related',
          ])
          .describe('Type of relationship'),
        description: z.string().describe('Brief description of the relationship'),
        confidence: z.enum(['low', 'medium', 'high']).describe('Confidence in this relationship'),
      })
    )
    .describe('Pairwise relationships between papers'),
  overall_gaps: z.array(z.string()).nullable().describe('Overall research gaps across all papers'),
})

export type SynthesisOutput = z.infer<typeof synthesisOutputSchema>

export interface PaperSummaryForSynthesis {
  index: number
  title: string
  authors: string[] | null
  research_problem: string | null
  method: string | null
  key_findings: string[] | null
  keywords: string[] | null
}

const SYNTHESIS_SYSTEM_PROMPT = `You are an expert literature review analyst. Your task is to analyze multiple paper summaries and identify:

1. **Themes**: Group papers into thematic clusters based on shared topics, methods, or research questions.
2. **Relations**: Identify pairwise relationships between papers (supports, contradicts, extends, uses_method_of, shares_dataset, cites, related).
3. **Research Gaps**: Identify what is missing or unexplored across the papers.

## Rules
- Each paper can belong to multiple themes.
- Only create relations where there is clear evidence from the summaries.
- Be specific in gap descriptions — vague gaps are not useful.
- Use paper indices (0-based) to reference papers.
`

export function buildSynthesisPrompt(papers: PaperSummaryForSynthesis[]): string {
  const papersText = papers
    .map((p) => {
      const parts = [`[Paper ${p.index}] "${p.title}"`]
      if (p.authors) parts.push(`Authors: ${p.authors.join(', ')}`)
      if (p.research_problem) parts.push(`Problem: ${p.research_problem}`)
      if (p.method) parts.push(`Method: ${p.method}`)
      if (p.key_findings) parts.push(`Findings: ${p.key_findings.join('; ')}`)
      if (p.keywords) parts.push(`Keywords: ${p.keywords.join(', ')}`)
      return parts.join('\n')
    })
    .join('\n\n---\n\n')

  return `${SYNTHESIS_SYSTEM_PROMPT}\n\n## Papers to Analyze\n\n${papersText}`
}
