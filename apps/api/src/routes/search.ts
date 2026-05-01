import { Hono } from 'hono'
import { db } from '../db/index.js'
import { papers, projects } from '../db/schema.js'
import { and, eq, sql } from 'drizzle-orm'
import type { AppEnv } from '../types.js'
import { createApiResponse, createApiError } from '@paperweave/shared'
import { logger } from '@paperweave/shared'
import { generateEmbedding, createAIProvider } from '@paperweave/ai'
import { env } from '../env.js'

export const searchRouter = new Hono<AppEnv>()

interface ChunkMatch {
  id: string
  paper_id: string
  chunk_index: number
  page_start: number
  page_end: number
  content: string
  similarity: number
}

// Semantic search across papers in a project
searchRouter.post('/query', async (c) => {
  const requestId = c.get('requestId')
  const userId = c.get('user')?.id

  if (!userId) {
    return c.json(createApiError('UNAUTHORIZED', 'Not authenticated', requestId), 401)
  }

  try {
    const body = await c.req.json()
    const projectId = body.projectId as string | undefined
    const query = body.query as string | undefined

    if (!projectId || !query) {
      return c.json(
        createApiError('VALIDATION_ERROR', 'projectId and query are required', requestId),
        400
      )
    }

    if (query.length > 1000) {
      return c.json(
        createApiError('VALIDATION_ERROR', 'Query too long (max 1000 chars)', requestId),
        400
      )
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

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query)

    // Call the match_chunks function via raw SQL
    const results = await db.execute(
      sql`SELECT * FROM match_chunks(${JSON.stringify(queryEmbedding)}::vector, ${projectId}::uuid, 10, 0.3)`
    )

    const matches = results as unknown as ChunkMatch[]

    // Enrich with paper titles
    const enriched = await Promise.all(
      matches.map(async (row) => {
        const [paper] = await db
          .select({ title: papers.title, original_filename: papers.original_filename })
          .from(papers)
          .where(eq(papers.id, row.paper_id))
          .limit(1)
        return {
          ...row,
          paper_title: paper?.title || paper?.original_filename || 'Unknown',
        }
      })
    )

    return c.json(createApiResponse(enriched, requestId))
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    logger.error('Search failed', { requestId, error: msg })
    return c.json(createApiError('SEARCH_ERROR', `Search failed: ${msg}`, requestId), 500)
  }
})

// Ask a question about papers (RAG: search + AI answer)
searchRouter.post('/ask', async (c) => {
  const requestId = c.get('requestId')
  const userId = c.get('user')?.id

  if (!userId) {
    return c.json(createApiError('UNAUTHORIZED', 'Not authenticated', requestId), 401)
  }

  try {
    const body = await c.req.json()
    const projectId = body.projectId as string | undefined
    const question = body.question as string | undefined

    if (!projectId || !question) {
      return c.json(
        createApiError('VALIDATION_ERROR', 'projectId and question are required', requestId),
        400
      )
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

    // Generate embedding for the question
    const queryEmbedding = await generateEmbedding(question)

    // Find relevant chunks
    const results = await db.execute(
      sql`SELECT * FROM match_chunks(${JSON.stringify(queryEmbedding)}::vector, ${projectId}::uuid, 5, 0.4)`
    )

    const matches = results as unknown as ChunkMatch[]

    if (matches.length === 0) {
      return c.json(
        createApiResponse(
          {
            answer: 'I could not find relevant information in your papers to answer this question.',
            sources: [],
          },
          requestId
        )
      )
    }

    // Build context from matched chunks
    const context = matches
      .map((row, i) => `[Source ${i + 1}, pages ${row.page_start}-${row.page_end}]\n${row.content}`)
      .join('\n\n---\n\n')

    const prompt = `Based on the following excerpts from research papers, answer the question below. 
Cite your sources using [Source N] notation. If the information is not available in the sources, say so.

## Sources
${context}

## Question
${question}

## Answer`

    // Generate answer with AI
    const aiProvider = createAIProvider({
      provider: env.AI_MODEL_PROVIDER as 'openai' | 'anthropic' | 'gemini' | 'groq' | 'openrouter',
      model: env.AI_MODEL_NAME,
    })

    const result = await aiProvider.generateDraft(prompt)

    // Get paper titles for sources
    const sources = await Promise.all(
      matches.map(async (row) => {
        const [paper] = await db
          .select({ title: papers.title, original_filename: papers.original_filename })
          .from(papers)
          .where(eq(papers.id, row.paper_id))
          .limit(1)
        return {
          paper_title: paper?.title || paper?.original_filename || 'Unknown',
          page_start: row.page_start,
          page_end: row.page_end,
          similarity: row.similarity,
        }
      })
    )

    return c.json(
      createApiResponse(
        {
          answer: result.text,
          sources,
        },
        requestId
      )
    )
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    logger.error('Ask failed', { requestId, error: msg })
    return c.json(createApiError('AI_ERROR', `Ask failed: ${msg}`, requestId), 500)
  }
})
