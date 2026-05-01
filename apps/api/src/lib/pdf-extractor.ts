import { PDFParse } from 'pdf-parse'

export interface ExtractedPage {
  pageNumber: number
  text: string
}

export interface ExtractionResult {
  pages: ExtractedPage[]
  totalPages: number
  metadata: {
    title?: string
    author?: string
    subject?: string
  }
}

/**
 * Extract text from a PDF buffer, returning text per page.
 */
export async function extractPdfText(buffer: Buffer): Promise<ExtractionResult> {
  const pdf = new PDFParse({ data: new Uint8Array(buffer) })

  // Get text per page
  const textResult = await pdf.getText()

  const pages: ExtractedPage[] = textResult.pages
    .filter((p) => p.text.trim().length > 0)
    .map((p) => ({
      pageNumber: p.num,
      text: p.text.trim(),
    }))

  // Get metadata
  let metadata: ExtractionResult['metadata'] = {}
  try {
    const info = await pdf.getInfo()
    metadata = {
      title: info.info?.Title || undefined,
      author: info.info?.Author || undefined,
      subject: info.info?.Subject || undefined,
    }
  } catch {
    // metadata extraction is optional
  }

  await pdf.destroy()

  return {
    pages,
    totalPages: textResult.total,
    metadata,
  }
}
