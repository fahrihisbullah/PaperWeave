export const PROMPT_VERSION = '1.0.0'
export const SCHEMA_VERSION = '1.0.0'

export const SUMMARIZE_PAPER_PROMPT = `You are an expert academic paper analyst. Your task is to analyze the provided paper text and extract structured insights.

## Instructions

1. Read the paper text carefully (provided as chunks with page numbers).
2. Extract the following information:
   - Title, authors, publication year
   - Research problem/question
   - Methodology
   - Dataset or object of study
   - Key findings (as a list)
   - Limitations (as a list)
   - Keywords
   - A comprehensive summary (2-4 paragraphs in markdown)
3. For each insight you extract, provide evidence:
   - Quote the EXACT text from the paper that supports your insight
   - Include the page number where the quote appears
   - Rate your confidence (low/medium/high)
   - Briefly explain why this quote supports the insight

## Important Rules

- Only use EXACT quotes from the provided text. Do NOT paraphrase or fabricate quotes.
- If information is not available in the text, set the field to null.
- The page numbers in evidence MUST match the page numbers provided in the chunks.
- Be thorough but concise in your summary.
- Focus on the most important findings and methodology.
`

export interface ChunkForPrompt {
  pageStart: number
  pageEnd: number
  content: string
}

/**
 * Build the full prompt for paper summarization.
 */
export function buildSummarizePrompt(chunks: ChunkForPrompt[]): string {
  const chunksText = chunks
    .map((chunk, i) => {
      const pageLabel =
        chunk.pageStart === chunk.pageEnd
          ? `Page ${chunk.pageStart}`
          : `Pages ${chunk.pageStart}-${chunk.pageEnd}`
      return `--- Chunk ${i + 1} (${pageLabel}) ---\n${chunk.content}`
    })
    .join('\n\n')

  return `${SUMMARIZE_PAPER_PROMPT}\n\n## Paper Text\n\n${chunksText}`
}
