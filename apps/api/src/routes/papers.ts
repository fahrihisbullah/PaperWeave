import { Hono } from 'hono'
import { db } from '../db/index.js'
import { papers } from '../db/schema.js'
import { projects } from '../db/schema.js'
import { and, desc, eq, sql } from 'drizzle-orm'
import type { AppEnv } from '../types.js'
import { createApiResponse, createApiError, getStoragePath } from '@paperweave/shared'
import { logger } from '@paperweave/shared'
import { supabase, PAPERS_BUCKET, MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from '../lib/supabase.js'
import { createHash } from 'node:crypto'

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

async function runAsUser<T>(userId: string, action: (tx: DbTransaction) => Promise<T>) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.current_user_id', ${userId}, true)`)
    return action(tx)
  })
}

export const papersRouter = new Hono<AppEnv>()

// List papers for a project
papersRouter.get('/', async (c) => {
  const requestId = c.get('requestId')
  const userId = c.get('user')?.id
  const projectId = c.req.query('projectId')

  if (!userId) {
    return c.json(createApiError('UNAUTHORIZED', 'Not authenticated', requestId), 401)
  }

  if (!projectId) {
    return c.json(
      createApiError('VALIDATION_ERROR', 'projectId query param required', requestId),
      400
    )
  }

  try {
    // Verify user owns the project
    const [project] = await runAsUser(userId, (tx) =>
      tx
        .select()
        .from(projects)
        .where(and(eq(projects.id, projectId), eq(projects.owner_id, userId)))
        .limit(1)
    )

    if (!project) {
      return c.json(createApiError('NOT_FOUND', 'Project not found', requestId), 404)
    }

    const paperList = await db
      .select({
        id: papers.id,
        project_id: papers.project_id,
        title: papers.title,
        original_filename: papers.original_filename,
        mime_type: papers.mime_type,
        file_size_bytes: papers.file_size_bytes,
        status: papers.status,
        total_pages: papers.total_pages,
        created_at: papers.created_at,
        updated_at: papers.updated_at,
      })
      .from(papers)
      .where(and(eq(papers.project_id, projectId), eq(papers.uploaded_by, userId)))
      .orderBy(desc(papers.created_at))

    return c.json(createApiResponse(paperList, requestId))
  } catch (error) {
    logger.error('Failed to fetch papers', { requestId, error })
    return c.json(createApiError('DB_ERROR', 'Failed to fetch papers', requestId), 500)
  }
})

// Upload a paper
papersRouter.post('/upload', async (c) => {
  const requestId = c.get('requestId')
  const userId = c.get('user')?.id

  if (!userId) {
    return c.json(createApiError('UNAUTHORIZED', 'Not authenticated', requestId), 401)
  }

  try {
    const formData = await c.req.formData()
    const file = formData.get('file') as File | null
    const projectId = formData.get('projectId') as string | null
    const title = (formData.get('title') as string | null)?.trim() || null

    if (!file) {
      return c.json(createApiError('VALIDATION_ERROR', 'No file provided', requestId), 400)
    }

    if (!projectId) {
      return c.json(createApiError('VALIDATION_ERROR', 'projectId is required', requestId), 400)
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return c.json(
        createApiError('VALIDATION_ERROR', 'Only PDF files are allowed', requestId),
        400
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return c.json(
        createApiError(
          'VALIDATION_ERROR',
          `File too large. Max size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          requestId
        ),
        400
      )
    }

    // Verify user owns the project
    const [project] = await runAsUser(userId, (tx) =>
      tx
        .select()
        .from(projects)
        .where(and(eq(projects.id, projectId), eq(projects.owner_id, userId)))
        .limit(1)
    )

    if (!project) {
      return c.json(createApiError('NOT_FOUND', 'Project not found', requestId), 404)
    }

    // Generate paper ID for storage path
    const paperId = crypto.randomUUID()
    const storagePath = getStoragePath(userId, projectId, paperId, file.name)

    // Read file buffer and compute checksum
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const checksum = createHash('sha256').update(buffer).digest('hex')

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(PAPERS_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      logger.error('Supabase storage upload failed', { requestId, error: uploadError })
      return c.json(
        createApiError('STORAGE_ERROR', `Upload failed: ${uploadError.message}`, requestId),
        500
      )
    }

    // Save metadata to database
    const [newPaper] = await db
      .insert(papers)
      .values({
        id: paperId,
        project_id: projectId,
        uploaded_by: userId,
        title: title || file.name.replace(/\.pdf$/i, ''),
        original_filename: file.name,
        storage_bucket: PAPERS_BUCKET,
        storage_path: storagePath,
        mime_type: file.type,
        file_size_bytes: file.size,
        checksum_sha256: checksum,
        status: 'uploaded',
      })
      .returning()

    if (!newPaper) {
      throw new Error('Paper insert returned no rows')
    }

    logger.info('Paper uploaded', { requestId, paperId: newPaper.id, projectId, userId })
    return c.json(createApiResponse(newPaper, requestId), 201)
  } catch (error) {
    logger.error('Failed to upload paper', { requestId, error })
    return c.json(createApiError('UPLOAD_ERROR', 'Failed to upload paper', requestId), 500)
  }
})

// Get single paper
papersRouter.get('/:id', async (c) => {
  const requestId = c.get('requestId')
  const userId = c.get('user')?.id
  const paperId = c.req.param('id')

  if (!userId) {
    return c.json(createApiError('UNAUTHORIZED', 'Not authenticated', requestId), 401)
  }

  try {
    const [paper] = await db
      .select()
      .from(papers)
      .where(and(eq(papers.id, paperId), eq(papers.uploaded_by, userId)))
      .limit(1)

    if (!paper) {
      return c.json(createApiError('NOT_FOUND', 'Paper not found', requestId), 404)
    }

    return c.json(createApiResponse(paper, requestId))
  } catch (error) {
    logger.error('Failed to fetch paper', { requestId, error })
    return c.json(createApiError('DB_ERROR', 'Failed to fetch paper', requestId), 500)
  }
})

// Delete a paper
papersRouter.delete('/:id', async (c) => {
  const requestId = c.get('requestId')
  const userId = c.get('user')?.id
  const paperId = c.req.param('id')

  if (!userId) {
    return c.json(createApiError('UNAUTHORIZED', 'Not authenticated', requestId), 401)
  }

  try {
    const [paper] = await db
      .select()
      .from(papers)
      .where(and(eq(papers.id, paperId), eq(papers.uploaded_by, userId)))
      .limit(1)

    if (!paper) {
      return c.json(createApiError('NOT_FOUND', 'Paper not found', requestId), 404)
    }

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from(paper.storage_bucket)
      .remove([paper.storage_path])

    if (deleteError) {
      logger.warn('Failed to delete file from storage', { requestId, error: deleteError })
      // Continue with DB deletion even if storage delete fails
    }

    // Delete from database
    await db.delete(papers).where(eq(papers.id, paperId))

    logger.info('Paper deleted', { requestId, paperId, userId })
    return c.json(createApiResponse({ success: true }, requestId))
  } catch (error) {
    logger.error('Failed to delete paper', { requestId, error })
    return c.json(createApiError('DB_ERROR', 'Failed to delete paper', requestId), 500)
  }
})
