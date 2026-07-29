import { nanoid } from 'nanoid'
import { DEFAULT_SETTINGS, type Conversation, type Message, type ChatSettings } from './types'

const STORAGE_KEY = 'novexus-conversations'
const SETTINGS_KEY = 'novexus-settings'

function isBrowser() {
  return typeof window !== 'undefined'
}

export function getConversations(): Conversation[] {
  if (!isBrowser()) return []
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveConversations(conversations: Conversation[]) {
  if (!isBrowser()) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
}

export function getSettings(): ChatSettings {
  if (!isBrowser()) return DEFAULT_SETTINGS
  try {
    const data = localStorage.getItem(SETTINGS_KEY)
    if (data) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) }
    }
    return DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: ChatSettings) {
  if (!isBrowser()) return
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function createConversation(model: string, systemPrompt: string): Conversation {
  return {
    id: nanoid(),
    title: 'New Chat',
    messages: [],
    model,
    systemPrompt,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export function createMessage(role: Message['role'], content: string): Message {
  return {
    id: nanoid(),
    role,
    content,
    timestamp: Date.now(),
  }
}

export function generateTitle(messages: Message[]): string {
  const firstUserMessage = messages.find((m) => m.role === 'user')
  if (!firstUserMessage) return 'New Chat'
  const content = firstUserMessage.content.trim()
  if (content.length <= 40) return content
  return content.substring(0, 40) + '...'
}
