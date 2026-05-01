export { modelProviderEnum, type ModelProvider } from './schema.js'
export {
  paperInsightSchema,
  insightEvidenceSchema,
  type PaperInsightOutput,
  type InsightEvidenceOutput,
} from './schema.js'
export { createAIProvider, type AIProviderConfig, type AIGenerateResult } from './provider/index.js'
export {
  SUMMARIZE_PAPER_PROMPT,
  buildSummarizePrompt,
  PROMPT_VERSION,
  SCHEMA_VERSION,
  type ChunkForPrompt,
} from './prompts/summarize.js'
export {
  synthesisOutputSchema,
  buildSynthesisPrompt,
  SYNTHESIS_PROMPT_VERSION,
  type SynthesisOutput,
  type PaperSummaryForSynthesis,
} from './prompts/synthesize.js'
export { buildDraftPrompt, DRAFT_PROMPT_VERSION, type DraftInput } from './prompts/draft.js'
export { generateEmbedding, generateEmbeddings, EMBEDDING_DIMENSIONS } from './embeddings.js'
