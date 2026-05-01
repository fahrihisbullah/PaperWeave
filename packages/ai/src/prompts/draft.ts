export const DRAFT_PROMPT_VERSION = '1.0.0'

export interface DraftInput {
  projectTitle: string
  themes: Array<{
    title: string
    description: string
    papers: Array<{ title: string; findings: string[] | null }>
    research_gaps: string[] | null
  }>
  relations: Array<{
    sourcePaper: string
    targetPaper: string
    relationType: string
    description: string
  }>
  overallGaps: string[] | null
}

const DRAFT_SYSTEM_PROMPT = `You are an expert academic writer. Generate a structured literature review draft in Markdown format.

## Structure
1. **Introduction** — Brief overview of the research area and scope of the review.
2. **Thematic Analysis** — One section per theme, discussing papers within that theme.
3. **Cross-Paper Comparison** — Highlight agreements, contradictions, and methodological differences.
4. **Research Gaps** — Summarize identified gaps and future directions.
5. **Conclusion** — Synthesize the overall state of knowledge.

## Rules
- Write in academic tone but keep it readable.
- Reference papers by their titles.
- Use proper Markdown headings (##, ###).
- Each section should be 1-3 paragraphs.
- Total length: 800-1500 words.
`

export function buildDraftPrompt(input: DraftInput): string {
  let context = `## Project: "${input.projectTitle}"\n\n`

  context += '## Themes\n\n'
  for (const theme of input.themes) {
    context += `### ${theme.title}\n`
    context += `${theme.description}\n`
    context += `Papers: ${theme.papers.map((p) => `"${p.title}"`).join(', ')}\n`
    if (theme.research_gaps && theme.research_gaps.length > 0) {
      context += `Gaps: ${theme.research_gaps.join('; ')}\n`
    }
    context += '\n'
  }

  if (input.relations.length > 0) {
    context += '## Key Relations\n\n'
    for (const rel of input.relations) {
      context += `- "${rel.sourcePaper}" ${rel.relationType} "${rel.targetPaper}": ${rel.description}\n`
    }
    context += '\n'
  }

  if (input.overallGaps && input.overallGaps.length > 0) {
    context += '## Overall Research Gaps\n\n'
    context += input.overallGaps.map((g) => `- ${g}`).join('\n')
    context += '\n'
  }

  return `${DRAFT_SYSTEM_PROMPT}\n\n${context}\n\nPlease generate the literature review draft now.`
}
