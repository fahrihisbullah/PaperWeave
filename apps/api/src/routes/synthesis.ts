import { Hono } from 'hono'
import { db } from '../db/index.js'
import { papers, projects } from '../db/schema.js'
import { paperInsights } from '../db/schema.js'
import { paperRelations, themes, themePapers } from '../db/schema-synthesis.js'
import { and, eq, desc } from 'drizzle-orm'
import type { AppEnv } from '../types.js'
import { createApiResponse, createApiError } from '@paperweave/shared'
import { logger } from '@paperweave/shared'
import {
  createAIProvider,
  buildSynthesisPrompt,
  type PaperSummaryForSynthesis,
} from '@paperweave/ai'
import { env } from '../env.js'

export const synthesisRouter = new Hono<AppEnv>()

// Generate synthesis for a project
synthesisRouter.post('/generate', async (c) => {
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

    // Get all completed papers with insights
    const completedPapers = await db
      .select()
      .from(papers)
      .where(and(eq(papers.project_id, projectId), eq(papers.status, 'completed')))

    if (completedPapers.length < 2) {
      return c.json(
        createApiError(
          'VALIDATION_ERROR',
          'Need at least 2 completed papers for synthesis',
          requestId
        ),
        400
      )
    }

    // Get insights for each paper
    const paperSummaries: PaperSummaryForSynthesis[] = []

    for (let i = 0; i < completedPapers.length; i++) {
      const paper = completedPapers[i]!
      const [insight] = await db
        .select()
        .from(paperInsights)
        .where(eq(paperInsights.paper_id, paper.id))
        .orderBy(desc(paperInsights.created_at))
        .limit(1)

      paperSummaries.push({
        index: i,
        title: insight?.title || paper.title || paper.original_filename,
        authors: insight?.authors as string[] | null,
        research_problem: insight?.research_problem || null,
        method: insight?.method || null,
        key_findings: insight?.key_findings as string[] | null,
        keywords: insight?.keywords as string[] | null,
      })
    }

    // Generate synthesis with AI
    logger.info('Generating synthesis', { requestId, projectId, paperCount: paperSummaries.length })

    const aiProvider = createAIProvider({
      provider: env.AI_MODEL_PROVIDER as 'openai' | 'anthropic' | 'gemini' | 'groq' | 'openrouter',
      model: env.AI_MODEL_NAME,
    })

    const prompt = buildSynthesisPrompt(paperSummaries)
    const result = await aiProvider.generateSynthesis(prompt)

    // Clear old synthesis data for this project
    await db.delete(paperRelations).where(eq(paperRelations.project_id, projectId))
    await db
      .delete(themePapers)
      .where(
        eq(
          themePapers.theme_id,
          db.select({ id: themes.id }).from(themes).where(eq(themes.project_id, projectId))
        )
      )
    await db.delete(themes).where(eq(themes.project_id, projectId))

    // Save relations
    if (result.synthesis.relations.length > 0) {
      await db.insert(paperRelations).values(
        result.synthesis.relations.map((rel) => ({
          project_id: projectId,
          source_paper_id: completedPapers[rel.source_index]!.id,
          target_paper_id: completedPapers[rel.target_index]!.id,
          relation_type: rel.relation_type,
          description: rel.description,
          confidence: rel.confidence,
        }))
      )
    }

    // Save themes
    for (const themeData of result.synthesis.themes) {
      const [savedTheme] = await db
        .insert(themes)
        .values({
          project_id: projectId,
          title: themeData.title,
          description: themeData.description,
          keywords: themeData.keywords,
          research_gaps: themeData.research_gaps,
        })
        .returning()

      if (savedTheme && themeData.paper_indices.length > 0) {
        await db.insert(themePapers).values(
          themeData.paper_indices
            .filter((idx) => idx < completedPapers.length)
            .map((idx) => ({
              theme_id: savedTheme.id,
              paper_id: completedPapers[idx]!.id,
            }))
        )
      }
    }

    logger.info('Synthesis generated', {
      requestId,
      projectId,
      themes: result.synthesis.themes.length,
      relations: result.synthesis.relations.length,
    })

    return c.json(
      createApiResponse(
        {
          themes: result.synthesis.themes.length,
          relations: result.synthesis.relations.length,
          overall_gaps: result.synthesis.overall_gaps,
        },
        requestId
      ),
      201
    )
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    logger.error('Synthesis generation failed', { requestId, error: msg })
    return c.json(createApiError('AI_ERROR', `Synthesis failed: ${msg}`, requestId), 500)
  }
})

// Get synthesis data for a project
synthesisRouter.get('/', async (c) => {
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
    // Verify ownership
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.owner_id, userId)))
      .limit(1)

    if (!project) {
      return c.json(createApiError('NOT_FOUND', 'Project not found', requestId), 404)
    }

    const projectThemes = await db.select().from(themes).where(eq(themes.project_id, projectId))
    const relations = await db
      .select()
      .from(paperRelations)
      .where(eq(paperRelations.project_id, projectId))

    // Get theme-paper mappings
    const themeWithPapers = await Promise.all(
      projectThemes.map(async (theme) => {
        const tPapers = await db
          .select()
          .from(themePapers)
          .where(eq(themePapers.theme_id, theme.id))
        return { ...theme, paper_ids: tPapers.map((tp) => tp.paper_id) }
      })
    )

    return c.json(createApiResponse({ themes: themeWithPapers, relations }, requestId))
  } catch (error) {
    logger.error('Failed to fetch synthesis', { requestId, error })
    return c.json(createApiError('DB_ERROR', 'Failed to fetch synthesis', requestId), 500)
  }
})
