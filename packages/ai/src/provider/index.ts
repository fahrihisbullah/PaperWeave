import { ChatOpenAI } from '@langchain/openai'
import { ChatGroq } from '@langchain/groq'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { ChatAnthropic } from '@langchain/anthropic'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
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

function createChatModel(config: AIProviderConfig): BaseChatModel {
  switch (config.provider) {
    case 'openai':
      return new ChatOpenAI({
        model: config.model,
        temperature: 0.1,
        apiKey: config.apiKey || process.env.OPENAI_API_KEY,
      })
    case 'groq':
      return new ChatGroq({
        model: config.model,
        temperature: 0.1,
        apiKey: config.apiKey || process.env.GROQ_API_KEY,
      })
    case 'gemini':
      return new ChatGoogleGenerativeAI({
        model: config.model,
        temperature: 0.1,
        apiKey: config.apiKey || process.env.GEMINI_API_KEY,
      })
    case 'anthropic':
      return new ChatAnthropic({
        model: config.model,
        temperature: 0.1,
        apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY,
      })
    case 'openrouter':
      // OpenRouter uses OpenAI-compatible API
      return new ChatOpenAI({
        model: config.model,
        temperature: 0.1,
        apiKey: config.apiKey || process.env.OPENROUTER_API_KEY,
        configuration: {
          baseURL: 'https://openrouter.ai/api/v1',
        },
      })
    default:
      throw new Error(`Unsupported provider: ${config.provider}`)
  }
}

/**
 * Create an AI provider powered by LangChain.
 * Uses withStructuredOutput for type-safe JSON generation.
 */
export function createAIProvider(config: AIProviderConfig) {
  const chatModel = createChatModel(config)

  return {
    async generateInsight(prompt: string): Promise<AIGenerateResult> {
      const structuredModel = chatModel.withStructuredOutput(paperInsightSchema)
      const result = await structuredModel.invoke(prompt)

      return {
        insight: result as PaperInsightOutput,
        inputTokens: 0, // LangChain doesn't always expose this directly
        outputTokens: 0,
        modelProvider: config.provider,
        modelName: config.model,
      }
    },

    async generateSynthesis(prompt: string): Promise<AISynthesisResult> {
      const structuredModel = chatModel.withStructuredOutput(synthesisOutputSchema)
      const result = await structuredModel.invoke(prompt)

      return {
        synthesis: result as SynthesisOutput,
        inputTokens: 0,
        outputTokens: 0,
      }
    },

    async generateDraft(prompt: string): Promise<AITextResult> {
      const response = await chatModel.invoke(prompt)
      const text =
        typeof response.content === 'string' ? response.content : JSON.stringify(response.content)

      return {
        text,
        inputTokens: response.usage_metadata?.input_tokens ?? 0,
        outputTokens: response.usage_metadata?.output_tokens ?? 0,
      }
    },
  }
}
