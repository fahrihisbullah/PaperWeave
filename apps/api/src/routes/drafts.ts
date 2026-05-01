import { Hono } from 'hono'
import { db } from '../db/index.js'
import { papers, projects, paperInsights } from '../db/schema.js'
import { themes, themePapers, paperRelations, reviewDrafts } from '../db/schema-synthesis.js'
import { and, eq, desc } from 'drizzle-orm'
import type { AppEnv } from '../types.js'
import { createApiResponse, createApiError } from '@paperweave/shared'
import { logger } from '@paperweave/shared'
import {
  createAIProvider,
  buildDraftPrompt,
  DRAFT_PROMPT_VERSION,
  type DraftInput,
} from '@paperweave/ai'
import { env } from '../env.js'

export const draftsRouter = new Hono<AppEnv>()

// Generate a draft literature review
draftsRouter.post('/generate', async (c) => {
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

    // Verify ownership
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.owner_id, userId)))
      .limit(1)

    if (!project) {
      return c.json(createApiError('NOT_FOUND', 'Project not found', requestId), 404)
    }

    // Get themes with papers
    const projectThemes = await db.select().from(themes).where(eq(themes.project_id, projectId))

    if (projectThemes.length === 0) {
      return c.json(
        createApiError(
          'VALIDATION_ERROR',
          'Generate synthesis first before creating a draft',
          requestId
        ),
        400
      )
    }

    // Build draft input
    const draftInput: DraftInput = {
      projectTitle: project.title,
      themes: [],
      relations: [],
      overallGaps: null,
    }

    for (const theme of projectThemes) {
      const tPapers = await db.select().from(themePapers).where(eq(themePapers.theme_id, theme.id))
      const paperDetails = await Promise.all(
        tPapers.map(async (tp) => {
          const [paper] = await db.select().from(papers).where(eq(papers.id, tp.paper_id)).limit(1)
          const [insight] = await db
            .select()
            .from(paperInsights)
            .where(eq(paperInsights.paper_id, tp.paper_id))
            .orderBy(desc(paperInsights.created_at))
            .limit(1)
          return {
            title: insight?.title || paper?.title || 'Untitled',
            findings: insight?.key_findings as string[] | null,
          }
        })
      )

      draftInput.themes.push({
        title: theme.title,
        description: theme.description || '',
        papers: paperDetails,
        research_gaps: theme.research_gaps as string[] | null,
      })
    }

    // Get relations
    const relations = await db
      .select()
      .from(paperRelations)
      .where(eq(paperRelations.project_id, projectId))
    for (const rel of relations) {
      const [source] = await db
        .select()
        .from(papers)
        .where(eq(papers.id, rel.source_paper_id))
        .limit(1)
      const [target] = await db
        .select()
        .from(papers)
        .where(eq(papers.id, rel.target_paper_id))
        .limit(1)
      if (source && target) {
        draftInput.relations.push({
          sourcePaper: source.title || source.original_filename,
          targetPaper: target.title || target.original_filename,
          relationType: rel.relation_type,
          description: rel.description || '',
        })
      }
    }

    // Generate draft with AI
    logger.info('Generating draft', { requestId, projectId })

    const aiProvider = createAIProvider({
      provider: env.AI_MODEL_PROVIDER as 'openai' | 'anthropic' | 'gemini' | 'groq' | 'openrouter',
      model: env.AI_MODEL_NAME,
    })

    const prompt = buildDraftPrompt(draftInput)
    const result = await aiProvider.generateDraft(prompt)

    // Save draft
    const [draft] = await db
      .insert(reviewDrafts)
      .values({
        project_id: projectId,
        title: `Literature Review: ${project.title}`,
        content_markdown: result.text,
        structure: { themes: draftInput.themes.map((t) => t.title) },
        model_provider: env.AI_MODEL_PROVIDER,
        model_name: env.AI_MODEL_NAME,
        prompt_version: DRAFT_PROMPT_VERSION,
      })
      .returning()

    logger.info('Draft generated', { requestId, projectId, draftId: draft?.id })

    return c.json(createApiResponse(draft, requestId), 201)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    logger.error('Draft generation failed', { requestId, error: msg })
    return c.json(createApiError('AI_ERROR', `Draft generation failed: ${msg}`, requestId), 500)
  }
})

// List drafts for a project
draftsRouter.get('/', async (c) => {
  const requestId = c.get('requestId')
  const userId = c.get('user')?.id
  const projectId = c.req.query('projectId')

  if (!userId) {
    return c.json(createApiError('UNAUTHORIZED', 'Not authenticated', requestId), 401)
  }

  if (!projectId) {
    return c.json(createApiError('VALIDATION_ERROR', 'projectId required', requestId), 400)
  }

  try {
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.owner_id, userId)))
      .limit(1)

    if (!project) {
      return c.json(createApiError('NOT_FOUND', 'Project not found', requestId), 404)
    }

    const drafts = await db
      .select()
      .from(reviewDrafts)
      .where(eq(reviewDrafts.project_id, projectId))
      .orderBy(desc(reviewDrafts.created_at))

    return c.json(createApiResponse(drafts, requestId))
  } catch (error) {
    logger.error('Failed to fetch drafts', { requestId, error })
    return c.json(createApiError('DB_ERROR', 'Failed to fetch drafts', requestId), 500)
  }
})

// Get single draft
draftsRouter.get('/:id', async (c) => {
  const requestId = c.get('requestId')
  const userId = c.get('user')?.id
  const draftId = c.req.param('id')

  if (!userId) {
    return c.json(createApiError('UNAUTHORIZED', 'Not authenticated', requestId), 401)
  }

  try {
    const [draft] = await db
      .select()
      .from(reviewDrafts)
      .where(eq(reviewDrafts.id, draftId))
      .limit(1)

    if (!draft) {
      return c.json(createApiError('NOT_FOUND', 'Draft not found', requestId), 404)
    }

    // Verify ownership via project
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, draft.project_id), eq(projects.owner_id, userId)))
      .limit(1)

    if (!project) {
      return c.json(createApiError('NOT_FOUND', 'Draft not found', requestId), 404)
    }

    return c.json(createApiResponse(draft, requestId))
  } catch (error) {
    logger.error('Failed to fetch draft', { requestId, error })
    return c.json(createApiError('DB_ERROR', 'Failed to fetch draft', requestId), 500)
  }
})

// Update draft content (manual edit)
draftsRouter.put('/:id', async (c) => {
  const requestId = c.get('requestId')
  const userId = c.get('user')?.id
  const draftId = c.req.param('id')

  if (!userId) {
    return c.json(createApiError('UNAUTHORIZED', 'Not authenticated', requestId), 401)
  }

  try {
    const body = await c.req.json()
    const contentMarkdown = body.content_markdown as string | undefined

    if (!contentMarkdown) {
      return c.json(
        createApiError('VALIDATION_ERROR', 'content_markdown is required', requestId),
        400
      )
    }

    const [draft] = await db
      .select()
      .from(reviewDrafts)
      .where(eq(reviewDrafts.id, draftId))
      .limit(1)
    if (!draft) {
      return c.json(createApiError('NOT_FOUND', 'Draft not found', requestId), 404)
    }

    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, draft.project_id), eq(projects.owner_id, userId)))
      .limit(1)

    if (!project) {
      return c.json(createApiError('NOT_FOUND', 'Draft not found', requestId), 404)
    }

    const [updated] = await db
      .update(reviewDrafts)
      .set({ content_markdown: contentMarkdown, updated_at: new Date() })
      .where(eq(reviewDrafts.id, draftId))
      .returning()

    return c.json(createApiResponse(updated, requestId))
  } catch (error) {
    logger.error('Failed to update draft', { requestId, error })
    return c.json(createApiError('DB_ERROR', 'Failed to update draft', requestId), 500)
  }
})

// Export draft as markdown (download)
draftsRouter.get('/:id/export', async (c) => {
  const requestId = c.get('requestId')
  const userId = c.get('user')?.id
  const draftId = c.req.param('id')

  if (!userId) {
    return c.json(createApiError('UNAUTHORIZED', 'Not authenticated', requestId), 401)
  }

  try {
    const [draft] = await db
      .select()
      .from(reviewDrafts)
      .where(eq(reviewDrafts.id, draftId))
      .limit(1)
    if (!draft) {
      return c.json(createApiError('NOT_FOUND', 'Draft not found', requestId), 404)
    }

    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, draft.project_id), eq(projects.owner_id, userId)))
      .limit(1)

    if (!project) {
      return c.json(createApiError('NOT_FOUND', 'Draft not found', requestId), 404)
    }

    const filename = `${draft.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`

    return new Response(draft.content_markdown, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    logger.error('Failed to export draft', { requestId, error })
    return c.json(createApiError('DB_ERROR', 'Failed to export draft', requestId), 500)
  }
})
