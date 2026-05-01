import { z } from 'zod'

export const modelProviderEnum = z.enum(['openai', 'anthropic', 'gemini'])
export type ModelProvider = z.infer<typeof modelProviderEnum>

/**
 * Structured output schema for paper insight generation.
 * Uses .nullable() for OpenAI structured output compatibility.
 */
export const paperInsightSchema = z.object({
  title: z.string().nullable().describe('The title of the paper'),
  authors: z.array(z.string()).nullable().describe('List of author names'),
  publication_year: z.number().int().nullable().describe('Year of publication'),
  research_problem: z.string().nullable().describe('The main research problem or question'),
  method: z.string().nullable().describe('The methodology used'),
  dataset_or_object: z.string().nullable().describe('Dataset or object of study'),
  key_findings: z.array(z.string()).nullable().describe('Key findings of the paper'),
  limitations: z.array(z.string()).nullable().describe('Limitations mentioned'),
  keywords: z.array(z.string()).nullable().describe('Keywords or key terms'),
  summary_markdown: z
    .string()
    .nullable()
    .describe('A comprehensive summary in markdown format (2-4 paragraphs)'),
  evidence: z
    .array(
      z.object({
        insight_field: z
          .string()
          .describe(
            'Which field this evidence supports (e.g. "research_problem", "key_findings", "method")'
          ),
        claim_label: z.string().nullable().describe('Short label for the claim'),
        quote: z.string().describe('Exact quote from the paper text that supports this insight'),
        page: z.number().int().describe('Page number where the quote appears'),
        confidence: z.enum(['low', 'medium', 'high']).describe('Confidence level of this evidence'),
        explanation: z
          .string()
          .nullable()
          .describe('Brief explanation of why this quote supports the insight'),
      })
    )
    .describe('Evidence quotes from the paper that support the insights above'),
})

export type PaperInsightOutput = z.infer<typeof paperInsightSchema>

export const insightEvidenceSchema = z.object({
  insight_field: z.string(),
  claim_label: z.string().nullable(),
  quote: z.string(),
  page: z.number().int(),
  confidence: z.enum(['low', 'medium', 'high']),
  explanation: z.string().nullable(),
})

export type InsightEvidenceOutput = z.infer<typeof insightEvidenceSchema>
