import { Hono } from 'hono'
import { db } from '../db/index.js'
import { projects } from '../db/schema.js'
import { and, desc, eq, sql } from 'drizzle-orm'
import type { AppEnv } from '../types.js'
import { createApiResponse, createApiError } from '@paperweave/shared'
import { logger } from '@paperweave/shared'

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

type ProjectInput = {
  title: string
  description?: string
}

function parseProjectInput(input: unknown): ProjectInput | null {
  if (typeof input !== 'object' || input === null) {
    return null
  }

  const payload = input as Record<string, unknown>

  if (typeof payload.title !== 'string') {
    return null
  }

  const title = payload.title.trim()

  if (!title || title.length > 255) {
    return null
  }

  if (payload.description !== undefined && typeof payload.description !== 'string') {
    return null
  }

  const description = payload.description?.trim()

  if (description && description.length > 1000) {
    return null
  }

  return {
    title,
    description: description || undefined,
  }
}

export const projectsRouter = new Hono<AppEnv>()

async function runAsProjectUser<T>(userId: string, action: (tx: DbTransaction) => Promise<T>) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.current_user_id', ${userId}, true)`)
    return action(tx)
  })
}

projectsRouter.get('/', async (c) => {
  const requestId = c.get('requestId')
  const userId = c.get('user')?.id

  if (!userId) {
    logger.warn('Unauthorized project list access', { requestId })
    return c.json(createApiError('UNAUTHORIZED', 'Not authenticated', requestId), 401)
  }

  try {
    const projectList = await runAsProjectUser(userId, (tx) =>
      tx
        .select({
          id: projects.id,
          owner_id: projects.owner_id,
          title: projects.title,
          description: projects.description,
          status: projects.status,
          created_at: projects.created_at,
          updated_at: projects.updated_at,
        })
        .from(projects)
        .where(eq(projects.owner_id, userId))
        .orderBy(desc(projects.created_at))
    )

    return c.json(createApiResponse(projectList, requestId))
  } catch (error) {
    logger.error('Failed to fetch projects', { requestId, error })
    return c.json(createApiError('DB_ERROR', 'Failed to fetch projects', requestId), 500)
  }
})

projectsRouter.get('/:id', async (c) => {
  const requestId = c.get('requestId')
  const userId = c.get('user')?.id
  const projectId = c.req.param('id')

  if (!userId) {
    return c.json(createApiError('UNAUTHORIZED', 'Not authenticated', requestId), 401)
  }

  try {
    const project = await runAsProjectUser(userId, (tx) =>
      tx
        .select()
        .from(projects)
        .where(and(eq(projects.id, projectId), eq(projects.owner_id, userId)))
        .limit(1)
    )

    if (project.length === 0) {
      return c.json(createApiError('NOT_FOUND', 'Project not found', requestId), 404)
    }

    return c.json(createApiResponse(project[0], requestId))
  } catch (error) {
    logger.error('Failed to fetch project', { requestId, error })
    return c.json(createApiError('DB_ERROR', 'Failed to fetch project', requestId), 500)
  }
})

projectsRouter.post('/', async (c) => {
  const requestId = c.get('requestId')
  const userId = c.get('user')?.id

  if (!userId) {
    return c.json(createApiError('UNAUTHORIZED', 'Not authenticated', requestId), 401)
  }

  try {
    const body = await c.req.json()
    const parsed = parseProjectInput(body)

    if (!parsed) {
      return c.json(
        createApiError('VALIDATION_ERROR', 'Invalid input', requestId),
        400
      )
    }

    const [newProject] = await runAsProjectUser(userId, (tx) =>
      tx
        .insert(projects)
        .values({
          owner_id: userId,
          title: parsed.title,
          description: parsed.description,
          status: 'active',
        })
        .returning()
    )

    if (!newProject) {
      throw new Error('Project creation returned no rows')
    }

    logger.info('Project created', { requestId, projectId: newProject.id, userId })
    return c.json(createApiResponse(newProject, requestId), 201)
  } catch (error) {
    logger.error('Failed to create project', { requestId, error })
    return c.json(createApiError('DB_ERROR', 'Failed to create project', requestId), 500)
  }
})

projectsRouter.delete('/:id', async (c) => {
  const requestId = c.get('requestId')
  const userId = c.get('user')?.id
  const projectId = c.req.param('id')

  if (!userId) {
    return c.json(createApiError('UNAUTHORIZED', 'Not authenticated', requestId), 401)
  }

  try {
    const project = await runAsProjectUser(userId, (tx) =>
      tx
        .select()
        .from(projects)
        .where(and(eq(projects.id, projectId), eq(projects.owner_id, userId)))
        .limit(1)
    )

    if (project.length === 0) {
      return c.json(createApiError('NOT_FOUND', 'Project not found', requestId), 404)
    }

    await runAsProjectUser(userId, (tx) => tx.delete(projects).where(eq(projects.id, projectId)))
    logger.info('Project deleted', { requestId, projectId, userId })
    return c.json(createApiResponse({ success: true }, requestId))
  } catch (error) {
    logger.error('Failed to delete project', { requestId, error })
    return c.json(createApiError('DB_ERROR', 'Failed to delete project', requestId), 500)
  }
})
