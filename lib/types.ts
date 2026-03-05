export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  thinking?: string
  timestamp: number
  model?: string
  tokenCount?: number
  generationTime?: number
  isStreaming?: boolean
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  model: string
  systemPrompt: string
  createdAt: number
  updatedAt: number
}

export interface OllamaModel {
  name: string
  size: number
  digest: string
  modified_at: string
  details?: {
    format: string
    family: string
    parameter_size: string
    quantization_level: string
  }
}

export interface OllamaStreamResponse {
  model: string
  created_at: string
  message: {
    role: string
    content: string
  }
  done: boolean
  total_duration?: number
  eval_count?: number
  eval_duration?: number
  prompt_eval_count?: number
}

export interface ChatSettings {
  ollamaUrl: string
  temperature: number
  topP: number
  topK: number
  maxTokens: number
  repeatPenalty: number
  seed: number | null
}

export const DEFAULT_SETTINGS: ChatSettings = {
  ollamaUrl: 'http://localhost:11434',
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
  maxTokens: 4096,
  repeatPenalty: 1.1,
  seed: null,
}

export const DEFAULT_SYSTEM_PROMPT = 'You are a helpful, knowledgeable, and thoughtful AI assistant. Provide clear, accurate, and well-structured responses. Use markdown formatting when helpful.'
