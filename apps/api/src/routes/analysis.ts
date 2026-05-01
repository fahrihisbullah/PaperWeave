import { Hono } from 'hono'
import { db } from '../db/index.js'
import {
  analysisJobs,
  paperChunks,
  papers,
  projects,
  paperInsights,
  insightEvidence,
} from '../db/schema.js'
import { and, desc, eq } from 'drizzle-orm'
import type { AppEnv } from '../types.js'
import { createApiResponse, createApiError } from '@paperweave/shared'
import { logger } from '@paperweave/shared'
import { runExtractionPipeline } from '../lib/analysis-pipeline.js'

export const analysisRouter = new Hono<AppEnv>()

// Trigger analysis for a paper
analysisRouter.post('/trigger', async (c) => {
  const requestId = c.get('requestId')
  const userId = c.get('user')?.id

  if (!userId) {
    return c.json(createApiError('UNAUTHORIZED', 'Not authenticated', requestId), 401)
  }

  try {
    const body = await c.req.json()
    const paperId = body.paperId as string | undefined

    if (!paperId) {
      return c.json(createApiError('VALIDATION_ERROR', 'paperId is required', requestId), 400)
    }

    // Verify user owns the paper
    const [paper] = await db
      .select()
      .from(papers)
      .where(and(eq(papers.id, paperId), eq(papers.uploaded_by, userId)))
      .limit(1)

    if (!paper) {
      return c.json(createApiError('NOT_FOUND', 'Paper not found', requestId), 404)
    }

    // Verify user owns the project
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, paper.project_id), eq(projects.owner_id, userId)))
      .limit(1)

    if (!project) {
      return c.json(createApiError('NOT_FOUND', 'Project not found', requestId), 404)
    }

    // Check if there's already a pending/processing job for this paper
    const [existingJob] = await db
      .select()
      .from(analysisJobs)
      .where(and(eq(analysisJobs.paper_id, paperId), eq(analysisJobs.status, 'pending')))
      .limit(1)

    if (existingJob) {
      return c.json(
        createApiError('CONFLICT', 'Analysis already pending for this paper', requestId),
        409
      )
    }

    const [processingJob] = await db
      .select()
      .from(analysisJobs)
      .where(and(eq(analysisJobs.paper_id, paperId), eq(analysisJobs.status, 'processing')))
      .limit(1)

    if (processingJob) {
      return c.json(
        createApiError('CONFLICT', 'Analysis already in progress for this paper', requestId),
        409
      )
    }

    // Create analysis job
    const [job] = await db
      .insert(analysisJobs)
      .values({
        paper_id: paperId,
        project_id: paper.project_id,
        triggered_by: userId,
        job_type: 'analyze_paper',
        status: 'pending',
        current_step: 'queued',
      })
      .returning()

    if (!job) {
      throw new Error('Failed to create analysis job')
    }

    // Update paper status to queued
    await db
      .update(papers)
      .set({ status: 'queued', updated_at: new Date() })
      .where(eq(papers.id, paperId))

    logger.info('Analysis job created', { requestId, jobId: job.id, paperId })

    // Fire-and-forget: run the pipeline asynchronously
    runExtractionPipeline(job.id).catch((err) => {
      logger.error('Pipeline execution error (unhandled)', { jobId: job.id, error: String(err) })
    })

    return c.json(createApiResponse(job, requestId), 201)
  } catch (error) {
    logger.error('Failed to trigger analysis', { requestId, error })
    return c.json(createApiError('DB_ERROR', 'Failed to trigger analysis', requestId), 500)
  }
})

// Retry a failed analysis
analysisRouter.post('/retry', async (c) => {
  const requestId = c.get('requestId')
  const userId = c.get('user')?.id

  if (!userId) {
    return c.json(createApiError('UNAUTHORIZED', 'Not authenticated', requestId), 401)
  }

  try {
    const body = await c.req.json()
    const paperId = body.paperId as string | undefined

    if (!paperId) {
      return c.json(createApiError('VALIDATION_ERROR', 'paperId is required', requestId), 400)
    }

    // Verify user owns the paper
    const [paper] = await db
      .select()
      .from(papers)
      .where(and(eq(papers.id, paperId), eq(papers.uploaded_by, userId)))
      .limit(1)

    if (!paper) {
      return c.json(createApiError('NOT_FOUND', 'Paper not found', requestId), 404)
    }

    // Only allow retry if paper is in failed state
    if (paper.status !== 'failed') {
      return c.json(
        createApiError(
          'CONFLICT',
          `Cannot retry: paper status is "${paper.status}", expected "failed"`,
          requestId
        ),
        409
      )
    }

    // Get the last failed job to increment retry count
    const [lastJob] = await db
      .select()
      .from(analysisJobs)
      .where(and(eq(analysisJobs.paper_id, paperId), eq(analysisJobs.status, 'failed')))
      .orderBy(desc(analysisJobs.created_at))
      .limit(1)

    const retryCount = (lastJob?.retry_count ?? 0) + 1
    const MAX_RETRIES = 3

    if (retryCount > MAX_RETRIES) {
      return c.json(
        createApiError(
          'CONFLICT',
          `Max retries (${MAX_RETRIES}) exceeded for this paper`,
          requestId
        ),
        409
      )
    }

    // Create new analysis job with incremented retry count
    const [job] = await db
      .insert(analysisJobs)
      .values({
        paper_id: paperId,
        project_id: paper.project_id,
        triggered_by: userId,
        job_type: 'reanalyze_paper',
        status: 'pending',
        current_step: 'queued',
        retry_count: retryCount,
      })
      .returning()

    if (!job) {
      throw new Error('Failed to create retry job')
    }

    // Reset paper status
    await db
      .update(papers)
      .set({ status: 'queued', last_error: null, updated_at: new Date() })
      .where(eq(papers.id, paperId))

    logger.info('Analysis retry triggered', { requestId, jobId: job.id, paperId, retryCount })

    // Fire-and-forget
    runExtractionPipeline(job.id).catch((err) => {
      logger.error('Pipeline retry error (unhandled)', { jobId: job.id, error: String(err) })
    })

    return c.json(createApiResponse(job, requestId), 201)
  } catch (error) {
    logger.error('Failed to retry analysis', { requestId, error })
    return c.json(createApiError('DB_ERROR', 'Failed to retry analysis', requestId), 500)
  }
})

// Get job status
analysisRouter.get('/jobs/:id', async (c) => {
  const requestId = c.get('requestId')
  const userId = c.get('user')?.id
  const jobId = c.req.param('id')

  if (!userId) {
    return c.json(createApiError('UNAUTHORIZED', 'Not authenticated', requestId), 401)
  }

  try {
    const [job] = await db
      .select()
      .from(analysisJobs)
      .where(and(eq(analysisJobs.id, jobId), eq(analysisJobs.triggered_by, userId)))
      .limit(1)

    if (!job) {
      return c.json(createApiError('NOT_FOUND', 'Job not found', requestId), 404)
    }

    return c.json(createApiResponse(job, requestId))
  } catch (error) {
    logger.error('Failed to fetch job', { requestId, error })
    return c.json(createApiError('DB_ERROR', 'Failed to fetch job', requestId), 500)
  }
})

// List jobs for a paper
analysisRouter.get('/jobs', async (c) => {
  const requestId = c.get('requestId')
  const userId = c.get('user')?.id
  const paperId = c.req.query('paperId')

  if (!userId) {
    return c.json(createApiError('UNAUTHORIZED', 'Not authenticated', requestId), 401)
  }

  if (!paperId) {
    return c.json(
      createApiError('VALIDATION_ERROR', 'paperId query param required', requestId),
      400
    )
  }

  try {
    const jobs = await db
      .select()
      .from(analysisJobs)
      .where(and(eq(analysisJobs.paper_id, paperId), eq(analysisJobs.triggered_by, userId)))
      .orderBy(desc(analysisJobs.created_at))

    return c.json(createApiResponse(jobs, requestId))
  } catch (error) {
    logger.error('Failed to fetch jobs', { requestId, error })
    return c.json(createApiError('DB_ERROR', 'Failed to fetch jobs', requestId), 500)
  }
})

// Get chunks for a paper
analysisRouter.get('/chunks', async (c) => {
  const requestId = c.get('requestId')
  const userId = c.get('user')?.id
  const paperId = c.req.query('paperId')

  if (!userId) {
    return c.json(createApiError('UNAUTHORIZED', 'Not authenticated', requestId), 401)
  }

  if (!paperId) {
    return c.json(
      createApiError('VALIDATION_ERROR', 'paperId query param required', requestId),
      400
    )
  }

  try {
    // Verify user owns the paper
    const [paper] = await db
      .select()
      .from(papers)
      .where(and(eq(papers.id, paperId), eq(papers.uploaded_by, userId)))
      .limit(1)

    if (!paper) {
      return c.json(createApiError('NOT_FOUND', 'Paper not found', requestId), 404)
    }

    const chunks = await db
      .select({
        id: paperChunks.id,
        chunk_index: paperChunks.chunk_index,
        page_start: paperChunks.page_start,
        page_end: paperChunks.page_end,
        source_type: paperChunks.source_type,
        section_label: paperChunks.section_label,
        char_count: paperChunks.char_count,
        token_estimate: paperChunks.token_estimate,
        content: paperChunks.content,
        created_at: paperChunks.created_at,
      })
      .from(paperChunks)
      .where(eq(paperChunks.paper_id, paperId))
      .orderBy(paperChunks.chunk_index)

    return c.json(createApiResponse(chunks, requestId))
  } catch (error) {
    logger.error('Failed to fetch chunks', { requestId, error })
    return c.json(createApiError('DB_ERROR', 'Failed to fetch chunks', requestId), 500)
  }
})

// Get insights for a paper
analysisRouter.get('/insights', async (c) => {
  const requestId = c.get('requestId')
  const userId = c.get('user')?.id
  const paperId = c.req.query('paperId')

  if (!userId) {
    return c.json(createApiError('UNAUTHORIZED', 'Not authenticated', requestId), 401)
  }

  if (!paperId) {
    return c.json(
      createApiError('VALIDATION_ERROR', 'paperId query param required', requestId),
      400
    )
  }

  try {
    // Verify user owns the paper
    const [paper] = await db
      .select()
      .from(papers)
      .where(and(eq(papers.id, paperId), eq(papers.uploaded_by, userId)))
      .limit(1)

    if (!paper) {
      return c.json(createApiError('NOT_FOUND', 'Paper not found', requestId), 404)
    }

    const insights = await db
      .select()
      .from(paperInsights)
      .where(eq(paperInsights.paper_id, paperId))
      .orderBy(desc(paperInsights.created_at))

    return c.json(createApiResponse(insights, requestId))
  } catch (error) {
    logger.error('Failed to fetch insights', { requestId, error })
    return c.json(createApiError('DB_ERROR', 'Failed to fetch insights', requestId), 500)
  }
})

// Get evidence for an insight
analysisRouter.get('/evidence', async (c) => {
  const requestId = c.get('requestId')
  const userId = c.get('user')?.id
  const insightId = c.req.query('insightId')

  if (!userId) {
    return c.json(createApiError('UNAUTHORIZED', 'Not authenticated', requestId), 401)
  }

  if (!insightId) {
    return c.json(
      createApiError('VALIDATION_ERROR', 'insightId query param required', requestId),
      400
    )
  }

  try {
    // Verify user owns the insight via paper
    const [insight] = await db
      .select()
      .from(paperInsights)
      .where(eq(paperInsights.id, insightId))
      .limit(1)

    if (!insight) {
      return c.json(createApiError('NOT_FOUND', 'Insight not found', requestId), 404)
    }

    const [paper] = await db
      .select()
      .from(papers)
      .where(and(eq(papers.id, insight.paper_id), eq(papers.uploaded_by, userId)))
      .limit(1)

    if (!paper) {
      return c.json(createApiError('NOT_FOUND', 'Paper not found', requestId), 404)
    }

    const evidence = await db
      .select()
      .from(insightEvidence)
      .where(eq(insightEvidence.paper_insight_id, insightId))
      .orderBy(insightEvidence.page)

    return c.json(createApiResponse(evidence, requestId))
  } catch (error) {
    logger.error('Failed to fetch evidence', { requestId, error })
    return c.json(createApiError('DB_ERROR', 'Failed to fetch evidence', requestId), 500)
  }
})
