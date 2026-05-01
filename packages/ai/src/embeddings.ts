import { embed, embedMany } from 'ai'
import { openai } from '@ai-sdk/openai'

const EMBEDDING_MODEL = 'text-embedding-3-small'
export const EMBEDDING_DIMENSIONS = 1536

/**
 * Generate embedding for a single text.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.embedding(EMBEDDING_MODEL),
    value: text,
  })
  return embedding
}

/**
 * Generate embeddings for multiple texts in batch.
 * Automatically handles chunking for large batches.
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []

  const { embeddings } = await embedMany({
    model: openai.embedding(EMBEDDING_MODEL),
    values: texts,
  })
  return embeddings
}
