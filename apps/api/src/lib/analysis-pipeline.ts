import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { analysisJobs, paperChunks, papers, paperInsights, insightEvidence } from '../db/schema.js'
import { supabase } from './supabase.js'
import { extractPdfText } from './pdf-extractor.js'
import { chunkPages } from './chunker.js'
import { logger } from '@paperweave/shared'
import {
  createAIProvider,
  buildSummarizePrompt,
  PROMPT_VERSION,
  SCHEMA_VERSION,
} from '@paperweave/ai'
import type { ChunkForPrompt } from '@paperweave/ai'
import { env } from '../env.js'

type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'
type PaperStatus = 'uploaded' | 'queued' | 'extracting' | 'summarizing' | 'completed' | 'failed'

// Guardrails
const MAX_PAGES = 200
const MAX_CHUNKS = 500
const MAX_FILE_SIZE_MB = 50
const PIPELINE_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

// Cost estimation (rough per-1K tokens)
const COST_PER_1K_INPUT: Record<string, number> = {
  'gpt-4o-mini': 0.00015,
  'gpt-4o': 0.0025,
  'claude-sonet-4-20250514': 0.003,
  'llama-3.3-70b-versatile': 0, // free on Groq
  'mixtral-8x7b-32768': 0, // free on Groq
}
const COST_PER_1K_OUTPUT: Record<string, number> = {
  'gpt-4o-mini': 0.0006,
  'gpt-4o': 0.01,
  'claude-sonet-4-20250514': 0.015,
  'llama-3.3-70b-versatile': 0,
  'mixtral-8x7b-32768': 0,
}

function estimateCost(model: string, inputTokens: number, outputTokens: number): string {
  const inputCost = (inputTokens / 1000) * (COST_PER_1K_INPUT[model] ?? 0.001)
  const outputCost = (outputTokens / 1000) * (COST_PER_1K_OUTPUT[model] ?? 0.002)
  return (inputCost + outputCost).toFixed(6)
}

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
 * Validate that a quote actually exists in the source chunks.
 * Returns the chunk_id if found, null otherwise.
 */
function findQuoteInChunks(
  quote: string,
  page: number,
  savedChunks: Array<{ id: string; page_start: number; page_end: number; content: string }>
): string | null {
  // Normalize quote for comparison
  const normalizedQuote = quote.toLowerCase().replace(/\s+/g, ' ').trim()

  for (const chunk of savedChunks) {
    // Check if page matches
    if (page < chunk.page_start || page > chunk.page_end) continue

    // Check if quote exists in chunk content
    const normalizedContent = chunk.content.toLowerCase().replace(/\s+/g, ' ')
    if (normalizedContent.includes(normalizedQuote)) {
      return chunk.id
    }

    // Fuzzy match: check if at least 60% of words match
    const quoteWords = normalizedQuote.split(' ')
    const matchedWords = quoteWords.filter((w) => normalizedContent.includes(w))
    if (matchedWords.length / quoteWords.length >= 0.6) {
      return chunk.id
    }
  }

  return null
}

/**
 * Run the full analysis pipeline: extraction → chunking → summarization.
 * Wrapped with a timeout guardrail.
 */
export async function runExtractionPipeline(jobId: string): Promise<void> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error(`Pipeline timed out after ${PIPELINE_TIMEOUT_MS / 1000}s`)),
      PIPELINE_TIMEOUT_MS
    )
  )

  try {
    await Promise.race([runPipeline(jobId), timeoutPromise])
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('Pipeline failed (top-level)', { jobId, error: errorMessage })

    // Update status if timeout
    if (errorMessage.includes('timed out')) {
      const [job] = await db.select().from(analysisJobs).where(eq(analysisJobs.id, jobId)).limit(1)
      if (job) {
        await db
          .update(analysisJobs)
          .set({
            status: 'failed',
            last_error: errorMessage,
            completed_at: new Date(),
            updated_at: new Date(),
          })
          .where(eq(analysisJobs.id, jobId))
        await db
          .update(papers)
          .set({ status: 'failed', last_error: errorMessage, updated_at: new Date() })
          .where(eq(papers.id, job.paper_id))
      }
    }
  }
}

async function runPipeline(jobId: string): Promise<void> {
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

    // Guardrail: max pages
    if (extraction.totalPages > MAX_PAGES) {
      throw new Error(
        `PDF has ${extraction.totalPages} pages, exceeding the limit of ${MAX_PAGES}. Please use a shorter document.`
      )
    }

    // Guardrail: max file size (already validated at upload, but double-check)
    if (buffer.length > MAX_FILE_SIZE_MB * 1024 * 1024) {
      throw new Error(
        `File size (${(buffer.length / 1024 / 1024).toFixed(1)}MB) exceeds limit of ${MAX_FILE_SIZE_MB}MB.`
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

    // Guardrail: max chunks
    if (chunks.length > MAX_CHUNKS) {
      throw new Error(
        `Document produced ${chunks.length} chunks, exceeding the limit of ${MAX_CHUNKS}. The document may be too large for analysis.`
      )
    }

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

    // Step 6: Summarization with AI
    await updateJobStatus(jobId, 'processing', 'summarizing')
    await updatePaperStatus(paper.id, 'summarizing')
    logger.info('Pipeline: summarizing with AI', { jobId, paperId: paper.id })

    const chunksForPrompt: ChunkForPrompt[] = chunks.map((c) => ({
      pageStart: c.pageStart,
      pageEnd: c.pageEnd,
      content: c.content,
    }))

    const prompt = buildSummarizePrompt(chunksForPrompt)

    const aiProvider = createAIProvider({
      provider: env.AI_MODEL_PROVIDER as 'openai' | 'anthropic' | 'gemini',
      model: env.AI_MODEL_NAME,
    })

    const aiResult = await aiProvider.generateInsight(prompt)

    // Update job with AI metadata + cost estimate
    const costEstimate = estimateCost(
      aiResult.modelName,
      aiResult.inputTokens,
      aiResult.outputTokens
    )

    await db
      .update(analysisJobs)
      .set({
        model_provider: aiResult.modelProvider,
        model_name: aiResult.modelName,
        prompt_version: PROMPT_VERSION,
        schema_version: SCHEMA_VERSION,
        input_token_count: aiResult.inputTokens,
        output_token_count: aiResult.outputTokens,
        cost_estimate_usd: costEstimate,
        updated_at: new Date(),
      })
      .where(eq(analysisJobs.id, jobId))

    logger.info('Pipeline: AI completed', {
      jobId,
      inputTokens: aiResult.inputTokens,
      outputTokens: aiResult.outputTokens,
      costUSD: costEstimate,
    })

    // Step 7: Save insights
    await updateJobStatus(jobId, 'processing', 'saving_insights')
    logger.info('Pipeline: saving insights', { jobId })

    // Delete existing insights for this paper (in case of re-analysis)
    await db.delete(paperInsights).where(eq(paperInsights.paper_id, paper.id))

    const [savedInsight] = await db
      .insert(paperInsights)
      .values({
        paper_id: paper.id,
        project_id: paper.project_id,
        analysis_job_id: jobId,
        title: aiResult.insight.title,
        authors: aiResult.insight.authors,
        publication_year: aiResult.insight.publication_year,
        research_problem: aiResult.insight.research_problem,
        method: aiResult.insight.method,
        dataset_or_object: aiResult.insight.dataset_or_object,
        key_findings: aiResult.insight.key_findings,
        limitations: aiResult.insight.limitations,
        keywords: aiResult.insight.keywords,
        summary_markdown: aiResult.insight.summary_markdown,
        prompt_version: PROMPT_VERSION,
        schema_version: SCHEMA_VERSION,
        model_provider: aiResult.modelProvider,
        model_name: aiResult.modelName,
      })
      .returning()

    // Step 8: Validate and save evidence
    if (savedInsight && aiResult.insight.evidence && aiResult.insight.evidence.length > 0) {
      await updateJobStatus(jobId, 'processing', 'validating_evidence')
      logger.info('Pipeline: validating evidence', {
        jobId,
        evidenceCount: aiResult.insight.evidence.length,
      })

      // Fetch saved chunks for validation
      const savedChunks = await db
        .select({
          id: paperChunks.id,
          page_start: paperChunks.page_start,
          page_end: paperChunks.page_end,
          content: paperChunks.content,
        })
        .from(paperChunks)
        .where(eq(paperChunks.paper_id, paper.id))

      const validEvidence: Array<{
        paper_insight_id: string
        paper_id: string
        chunk_id: string
        insight_field: string
        claim_label: string | null
        quote: string
        page: number
        confidence: 'low' | 'medium' | 'high'
        explanation: string | null
      }> = []

      for (const ev of aiResult.insight.evidence) {
        const chunkId = findQuoteInChunks(ev.quote, ev.page, savedChunks)
        if (chunkId) {
          validEvidence.push({
            paper_insight_id: savedInsight.id,
            paper_id: paper.id,
            chunk_id: chunkId,
            insight_field: ev.insight_field,
            claim_label: ev.claim_label,
            quote: ev.quote,
            page: ev.page,
            confidence: ev.confidence,
            explanation: ev.explanation,
          })
        } else {
          logger.warn('Evidence quote not found in chunks, skipping', {
            jobId,
            quote: ev.quote.substring(0, 80),
            page: ev.page,
          })
        }
      }

      if (validEvidence.length > 0) {
        await db.insert(insightEvidence).values(validEvidence)
        logger.info('Pipeline: evidence saved', {
          jobId,
          valid: validEvidence.length,
          total: aiResult.insight.evidence.length,
        })
      }
    }

    // Step 9: Mark as completed
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
