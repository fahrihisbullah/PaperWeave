import { createHash } from 'node:crypto'
import type { ExtractedPage } from './pdf-extractor.js'

export interface Chunk {
  chunkIndex: number
  pageStart: number
  pageEnd: number
  sourceType: 'page' | 'section' | 'paragraph'
  sectionLabel: string | null
  content: string
  contentHash: string
  charCount: number
  tokenEstimate: number
}

// Rough token estimate: ~4 chars per token for English text
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Chunk extracted pages into manageable pieces.
 *
 * Strategy:
 * - Primary: chunk by page (each page = 1 chunk)
 * - If a page is too long (>3000 chars), split into paragraphs
 * - If a page is too short (<100 chars), merge with next page
 */
export function chunkPages(pages: ExtractedPage[]): Chunk[] {
  const MAX_CHUNK_CHARS = 3000
  const MIN_CHUNK_CHARS = 100
  const chunks: Chunk[] = []
  let chunkIndex = 0

  let i = 0
  while (i < pages.length) {
    const page = pages[i]!

    if (page.text.length > MAX_CHUNK_CHARS) {
      // Split long page into paragraphs
      const paragraphs = splitIntoParagraphs(page.text)
      for (const para of paragraphs) {
        if (para.trim().length === 0) continue
        chunks.push(
          createChunk(
            chunkIndex++,
            page.pageNumber,
            page.pageNumber,
            'paragraph',
            null,
            para.trim()
          )
        )
      }
    } else if (page.text.length < MIN_CHUNK_CHARS && i + 1 < pages.length) {
      // Merge short page with next
      let merged = page.text
      let endPage = page.pageNumber
      while (i + 1 < pages.length && merged.length < MIN_CHUNK_CHARS * 2) {
        i++
        const nextPage = pages[i]!
        merged += '\n\n' + nextPage.text
        endPage = nextPage.pageNumber
      }
      chunks.push(createChunk(chunkIndex++, page.pageNumber, endPage, 'page', null, merged.trim()))
    } else {
      // Normal page chunk
      chunks.push(
        createChunk(chunkIndex++, page.pageNumber, page.pageNumber, 'page', null, page.text)
      )
    }

    i++
  }

  return chunks
}

function splitIntoParagraphs(text: string): string[] {
  // Split on double newlines or significant whitespace gaps
  const paragraphs = text.split(/\n{2,}/)

  // If we still have very long paragraphs, split further
  const result: string[] = []
  for (const para of paragraphs) {
    if (para.length > 3000) {
      // Split on single newlines
      const lines = para.split('\n')
      let current = ''
      for (const line of lines) {
        if (current.length + line.length > 2500 && current.length > 0) {
          result.push(current)
          current = line
        } else {
          current += (current ? '\n' : '') + line
        }
      }
      if (current) result.push(current)
    } else {
      result.push(para)
    }
  }

  return result
}

function createChunk(
  chunkIndex: number,
  pageStart: number,
  pageEnd: number,
  sourceType: 'page' | 'section' | 'paragraph',
  sectionLabel: string | null,
  content: string
): Chunk {
  return {
    chunkIndex,
    pageStart,
    pageEnd,
    sourceType,
    sectionLabel,
    content,
    contentHash: createHash('md5').update(content).digest('hex'),
    charCount: content.length,
    tokenEstimate: estimateTokens(content),
  }
}
