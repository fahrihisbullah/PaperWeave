import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { analysisJobs, paperChunks, papers } from '../db/schema.js'
import { supabase } from './supabase.js'
import { extractPdfText } from './pdf-extractor.js'
import { chunkPages } from './chunker.js'
import { logger } from '@paperweave/shared'

type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'
type PaperStatus = 'uploaded' | 'queued' | 'extracting' | 'summarizing' | 'completed' | 'failed'

async function updateJobStatus(jobId: string, status: JobStatus, step?: string, error?: string) {
  await db
    .update(analysisJobs)
    .set({
      status,
      current_step: step ?? null,
      last_error: error ?? null,
      updated_at: new Date(),
      ...(status === 'processing' ? { started_at: new Date() } : {}),
      ...(status === 'completed' || status === 'failed' ? { completed_at: new Date() } : {}),
    })
    .where(eq(analysisJobs.id, jobId))
}

async function updatePaperStatus(paperId: string, status: PaperStatus, error?: string) {
  await db
    .update(papers)
    .set({
      status,
      last_error: error ?? null,
      updated_at: new Date(),
    })
    .where(eq(papers.id, paperId))
}

/**
 * Run the extraction and chunking pipeline for a given analysis job.
 * This is designed to be called asynchronously (fire-and-forget from the endpoint).
 */
export async function runExtractionPipeline(jobId: string): Promise<void> {
  // Fetch the job
  const [job] = await db.select().from(analysisJobs).where(eq(analysisJobs.id, jobId)).limit(1)
  if (!job) {
    logger.error('Analysis job not found', { jobId })
    return
  }

  // Fetch the paper
  const [paper] = await db.select().from(papers).where(eq(papers.id, job.paper_id)).limit(1)
  if (!paper) {
    logger.error('Paper not found for job', { jobId, paperId: job.paper_id })
    await updateJobStatus(jobId, 'failed', undefined, 'Paper not found')
    return
  }

  try {
    // Step 1: Mark as processing
    await updateJobStatus(jobId, 'processing', 'downloading')
    await updatePaperStatus(paper.id, 'extracting')

    logger.info('Pipeline started: downloading PDF', { jobId, paperId: paper.id })

    // Step 2: Download PDF from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(paper.storage_bucket)
      .download(paper.storage_path)

    if (downloadError || !fileData) {
      throw new Error(`Failed to download PDF: ${downloadError?.message || 'No data returned'}`)
    }

    const buffer = Buffer.from(await fileData.arrayBuffer())

    // Step 3: Extract text
    await updateJobStatus(jobId, 'processing', 'extracting_text')
    logger.info('Pipeline: extracting text', { jobId, paperId: paper.id })

    const extraction = await extractPdfText(buffer)

    if (extraction.pages.length === 0) {
      throw new Error(
        'No text could be extracted from the PDF. The file may be image-based or empty.'
      )
    }

    // Update paper with total pages and title from metadata
    await db
      .update(papers)
      .set({
        total_pages: extraction.totalPages,
        title: extraction.metadata.title || paper.title,
        updated_at: new Date(),
      })
      .where(eq(papers.id, paper.id))

    // Step 4: Chunk the text
    await updateJobStatus(jobId, 'processing', 'chunking')
    logger.info('Pipeline: chunking text', { jobId, pages: extraction.pages.length })

    const chunks = chunkPages(extraction.pages)

    // Step 5: Save chunks to database
    await updateJobStatus(jobId, 'processing', 'saving_chunks')
    logger.info('Pipeline: saving chunks', { jobId, chunkCount: chunks.length })

    // Delete existing chunks for this paper (in case of re-analysis)
    await db.delete(paperChunks).where(eq(paperChunks.paper_id, paper.id))

    // Insert chunks in batches
    const BATCH_SIZE = 50
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE)
      await db.insert(paperChunks).values(
        batch.map((chunk) => ({
          paper_id: paper.id,
          project_id: paper.project_id,
          chunk_index: chunk.chunkIndex,
          page_start: chunk.pageStart,
          page_end: chunk.pageEnd,
          source_type: chunk.sourceType,
          section_label: chunk.sectionLabel,
          content: chunk.content,
          content_hash: chunk.contentHash,
          char_count: chunk.charCount,
          token_estimate: chunk.tokenEstimate,
        }))
      )
    }

    // Step 6: Mark as completed
    await updateJobStatus(jobId, 'completed', 'done')
    await updatePaperStatus(paper.id, 'completed')

    logger.info('Pipeline completed', {
      jobId,
      paperId: paper.id,
      totalPages: extraction.totalPages,
      totalChunks: chunks.length,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('Pipeline failed', { jobId, paperId: paper.id, error: errorMessage })

    await updateJobStatus(jobId, 'failed', undefined, errorMessage)
    await updatePaperStatus(paper.id, 'failed', errorMessage)
  }
}
