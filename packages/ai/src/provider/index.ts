import { generateText, Output } from 'ai'
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import { groq } from '@ai-sdk/groq'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { paperInsightSchema, type PaperInsightOutput, type ModelProvider } from '../schema.js'
import { synthesisOutputSchema, type SynthesisOutput } from '../prompts/synthesize.js'

export interface AIProviderConfig {
  provider: ModelProvider
  model: string
  apiKey?: string
}

export interface AIGenerateResult {
  insight: PaperInsightOutput
  inputTokens: number
  outputTokens: number
  modelProvider: string
  modelName: string
}

export interface AISynthesisResult {
  synthesis: SynthesisOutput
  inputTokens: number
  outputTokens: number
}

export interface AITextResult {
  text: string
  inputTokens: number
  outputTokens: number
}

function getModel(config: AIProviderConfig) {
  switch (config.provider) {
    case 'openai':
      return openai(config.model)
    case 'anthropic':
      return anthropic(config.model)
    case 'gemini':
      return google(config.model)
    case 'groq':
      return groq(config.model)
    case 'openrouter': {
      const openrouter = createOpenRouter({
        apiKey: config.apiKey || process.env.OPENROUTER_API_KEY,
      })
      return openrouter.chat(config.model)
    }
    default:
      throw new Error(`Unsupported provider: ${config.provider}`)
  }
}

/**
 * Create an AI provider that can generate structured paper insights, synthesis, and text.
 */
export function createAIProvider(config: AIProviderConfig) {
  const model = getModel(config)

  return {
    async generateInsight(prompt: string): Promise<AIGenerateResult> {
      const result = await generateText({
        model,
        output: Output.object({ schema: paperInsightSchema }),
        prompt,
        temperature: 0.1,
        maxOutputTokens: 4000,
      })

      if (!result.output) {
        throw new Error('AI did not return a valid structured output')
      }

      return {
        insight: result.output,
        inputTokens: result.usage?.inputTokens ?? 0,
        outputTokens: result.usage?.outputTokens ?? 0,
        modelProvider: config.provider,
        modelName: config.model,
      }
    },

    async generateSynthesis(prompt: string): Promise<AISynthesisResult> {
      const result = await generateText({
        model,
        output: Output.object({ schema: synthesisOutputSchema }),
        prompt,
        temperature: 0.2,
        maxOutputTokens: 4000,
      })

      if (!result.output) {
        throw new Error('AI did not return a valid synthesis output')
      }

      return {
        synthesis: result.output,
        inputTokens: result.usage?.inputTokens ?? 0,
        outputTokens: result.usage?.outputTokens ?? 0,
      }
    },

    async generateDraft(prompt: string): Promise<AITextResult> {
      const result = await generateText({
        model,
        prompt,
        temperature: 0.3,
        maxOutputTokens: 6000,
      })

      return {
        text: result.text,
        inputTokens: result.usage?.inputTokens ?? 0,
        outputTokens: result.usage?.outputTokens ?? 0,
      }
    },
  }
}
