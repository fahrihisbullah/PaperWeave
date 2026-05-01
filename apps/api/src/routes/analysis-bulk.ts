import { Hono } from 'hono'
import { db } from '../db/index.js'
import { analysisJobs, papers, projects } from '../db/schema.js'
import { and, eq, inArray, desc } from 'drizzle-orm'
import type { AppEnv } from '../types.js'
import { createApiResponse, createApiError } from '@paperweave/shared'
import { logger } from '@paperweave/shared'
import { runExtractionPipeline } from '../lib/analysis-pipeline.js'

export const analysisBulkRouter = new Hono<AppEnv>()

// Bulk analyze: trigger analysis for multiple papers
analysisBulkRouter.post('/analyze-all', async (c) => {
  const requestId = c.get('requestId')
  const userId = c.get('user')?.id

  if (!userId) {
    return c.json(createApiError('UNAUTHORIZED', 'Not authenticated', requestId), 401)
  }

  try {
    const body = await c.req.json()
    const projectId = body.projectId as string | undefined

    if (!projectId) {
      return c.json(createApiError('VALIDATION_ERROR', 'projectId is required', requestId), 400)
    }

    // Verify user owns the project
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.owner_id, userId)))
      .limit(1)

    if (!project) {
      return c.json(createApiError('NOT_FOUND', 'Project not found', requestId), 404)
    }

    // Get all papers in "uploaded" status (not yet analyzed)
    const uploadedPapers = await db
      .select()
      .from(papers)
      .where(
        and(
          eq(papers.project_id, projectId),
          eq(papers.uploaded_by, userId),
          eq(papers.status, 'uploaded')
        )
      )

    if (uploadedPapers.length === 0) {
      return c.json(createApiResponse({ triggered: 0, message: 'No papers to analyze' }, requestId))
    }

    // Create jobs for each paper
    const createdJobs: string[] = []

    for (const paper of uploadedPapers) {
      // Check no pending/processing job exists
      const [existing] = await db
        .select()
        .from(analysisJobs)
        .where(
          and(
            eq(analysisJobs.paper_id, paper.id),
            inArray(analysisJobs.status, ['pending', 'processing'])
          )
        )
        .limit(1)

      if (existing) continue

      const [job] = await db
        .insert(analysisJobs)
        .values({
          paper_id: paper.id,
          project_id: projectId,
          triggered_by: userId,
          job_type: 'analyze_paper',
          status: 'pending',
          current_step: 'queued',
        })
        .returning()

      if (job) {
        await db
          .update(papers)
          .set({ status: 'queued', updated_at: new Date() })
          .where(eq(papers.id, paper.id))

        createdJobs.push(job.id)
      }
    }

    // Fire-and-forget: run pipelines sequentially to avoid overload
    if (createdJobs.length > 0) {
      runBulkPipelines(createdJobs).catch((err) => {
        logger.error('Bulk pipeline error', { error: String(err) })
      })
    }

    logger.info('Bulk analyze triggered', { requestId, projectId, count: createdJobs.length })

    return c.json(
      createApiResponse({ triggered: createdJobs.length, jobIds: createdJobs }, requestId),
      201
    )
  } catch (error) {
    logger.error('Failed to bulk analyze', { requestId, error })
    return c.json(createApiError('DB_ERROR', 'Failed to bulk analyze', requestId), 500)
  }
})

// Bulk retry: retry all failed papers in a project
analysisBulkRouter.post('/retry-failed', async (c) => {
  const requestId = c.get('requestId')
  const userId = c.get('user')?.id

  if (!userId) {
    return c.json(createApiError('UNAUTHORIZED', 'Not authenticated', requestId), 401)
  }

  try {
    const body = await c.req.json()
    const projectId = body.projectId as string | undefined

    if (!projectId) {
      return c.json(createApiError('VALIDATION_ERROR', 'projectId is required', requestId), 400)
    }

    // Verify user owns the project
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.owner_id, userId)))
      .limit(1)

    if (!project) {
      return c.json(createApiError('NOT_FOUND', 'Project not found', requestId), 404)
    }

    // Get all failed papers
    const failedPapers = await db
      .select()
      .from(papers)
      .where(
        and(
          eq(papers.project_id, projectId),
          eq(papers.uploaded_by, userId),
          eq(papers.status, 'failed')
        )
      )

    if (failedPapers.length === 0) {
      return c.json(
        createApiResponse({ triggered: 0, message: 'No failed papers to retry' }, requestId)
      )
    }

    const MAX_RETRIES = 3
    const createdJobs: string[] = []

    for (const paper of failedPapers) {
      // Get last job retry count
      const [lastJob] = await db
        .select()
        .from(analysisJobs)
        .where(and(eq(analysisJobs.paper_id, paper.id), eq(analysisJobs.status, 'failed')))
        .orderBy(desc(analysisJobs.created_at))
        .limit(1)

      const retryCount = (lastJob?.retry_count ?? 0) + 1
      if (retryCount > MAX_RETRIES) continue

      const [job] = await db
        .insert(analysisJobs)
        .values({
          paper_id: paper.id,
          project_id: projectId,
          triggered_by: userId,
          job_type: 'reanalyze_paper',
          status: 'pending',
          current_step: 'queued',
          retry_count: retryCount,
        })
        .returning()

      if (job) {
        await db
          .update(papers)
          .set({ status: 'queued', last_error: null, updated_at: new Date() })
          .where(eq(papers.id, paper.id))

        createdJobs.push(job.id)
      }
    }

    if (createdJobs.length > 0) {
      runBulkPipelines(createdJobs).catch((err) => {
        logger.error('Bulk retry pipeline error', { error: String(err) })
      })
    }

    logger.info('Bulk retry triggered', { requestId, projectId, count: createdJobs.length })

    return c.json(
      createApiResponse({ triggered: createdJobs.length, jobIds: createdJobs }, requestId),
      201
    )
  } catch (error) {
    logger.error('Failed to bulk retry', { requestId, error })
    return c.json(createApiError('DB_ERROR', 'Failed to bulk retry', requestId), 500)
  }
})

/**
 * Run pipelines sequentially to avoid overwhelming the system.
 * Each paper is independent — failure of one does not block others.
 */
async function runBulkPipelines(jobIds: string[]): Promise<void> {
  for (const jobId of jobIds) {
    try {
      await runExtractionPipeline(jobId)
    } catch (err) {
      logger.error('Bulk pipeline: single job failed, continuing', { jobId, error: String(err) })
      // Continue with next job — partial failure is OK
    }
  }
}
