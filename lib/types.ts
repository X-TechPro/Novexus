export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  thinking?: string
  timestamp: number
  model?: string
  tokenCount?: number
  generationTime?: number
  isStreaming?: boolean
  images?: string[]
  tool_calls?: any[]
  tool_name?: string
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
  contextLength?: number
  capabilities?: string[]
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
  maxContextLength: number
  repeatPenalty: number
  seed: number | null
}

export const DEFAULT_SETTINGS: ChatSettings = {
  ollamaUrl: 'http://localhost:11434',
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
  maxTokens: 4096,
  maxContextLength: 0,
  repeatPenalty: 1.1,
  seed: null,
}

export const DEFAULT_SYSTEM_PROMPT = "You are Novexus, a friendly and smart AI Assistant. You have access to tools, so if a task needs ANY of the tools, you should absolutely use them without even thinking. If the user asks you to remember something or is talking about his life/projects, you can use the 'memories' tool to store or retrieve memories. Talk like a member of Gen Z. Take a forward-thinking view. Tell it like it is; don't sugar-coat responses. Use quick and clever humor when appropriate. Be concise but helpful. Format your responses nicely with clear structure. Format your responses using Markdown for better readability. Use tables, code blocks, and proper formatting. You are runnning locally on the user's device."
