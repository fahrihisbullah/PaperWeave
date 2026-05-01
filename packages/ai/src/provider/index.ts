import { generateText, Output } from 'ai'
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import { paperInsightSchema, type PaperInsightOutput, type ModelProvider } from '../schema.js'

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

function getModel(config: AIProviderConfig) {
  switch (config.provider) {
    case 'openai':
      return openai(config.model)
    case 'anthropic':
      return anthropic(config.model)
    case 'gemini':
      return google(config.model)
    default:
      throw new Error(`Unsupported provider: ${config.provider}`)
  }
}

/**
 * Create an AI provider that can generate structured paper insights.
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
  }
}
