import { z } from 'zod'

export const modelProviderEnum = z.enum(['openai', 'anthropic', 'gemini'])
export type ModelProvider = z.infer<typeof modelProviderEnum>

export const aiInsightSchema = z.object({
  title: z.string().nullable(),
  authors: z.array(z.string()).nullable(),
  publication_year: z.number().int().nullable(),
  research_problem: z.string().nullable(),
  method: z.string().nullable(),
  dataset_or_object: z.string().nullable(),
  key_findings: z.array(z.string()).nullable(),
  limitations: z.array(z.string()).nullable(),
  keywords: z.array(z.string()).nullable(),
})

export type AIInsight = z.infer<typeof aiInsightSchema>

export interface AIProvider {
  name: ModelProvider
  generateInsight(prompt: string): Promise<AIInsight>
  generateText(prompt: string): Promise<string>
}

export interface AICompletionOptions {
  model?: string
  temperature?: number
  maxTokens?: number
}