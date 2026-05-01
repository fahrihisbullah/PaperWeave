import { OpenAIEmbeddings } from '@langchain/openai'

export const EMBEDDING_DIMENSIONS = 1536

const embeddingsModel = new OpenAIEmbeddings({
  model: 'text-embedding-3-small',
  dimensions: EMBEDDING_DIMENSIONS,
})

/**
 * Generate embedding for a single text using LangChain OpenAIEmbeddings.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const embedding = await embeddingsModel.embedQuery(text)
  return embedding
}

/**
 * Generate embeddings for multiple texts in batch using LangChain.
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []
  const embeddings = await embeddingsModel.embedDocuments(texts)
  return embeddings
}
