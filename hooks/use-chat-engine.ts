'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { nanoid } from 'nanoid'
import useSWR from 'swr'
import type { Conversation, Message, ChatSettings, OllamaModel } from '@/lib/types'
import {
  getConversations,
  saveConversations,
  getSettings,
  saveSettings,
  createConversation,
  createMessage,
  generateTitle,
} from '@/lib/chat-store'
import { DEFAULT_SYSTEM_PROMPT } from '@/lib/types'

const modelsFetcher = (url: string) => fetch(url).then((r) => r.json())

export function useChatEngine() {
  const [conversations, setConversations] = useState<Conversation[]>(() => getConversations())
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    () => getConversations()[0]?.id || null
  )
  const [settings, setSettingsState] = useState<ChatSettings>(() => getSettings())
  const [isGenerating, setIsGenerating] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [streamingThinking, setStreamingThinking] = useState('')
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [enableThinking, setEnableThinking] = useState(true)
  const abortControllerRef = useRef<AbortController | null>(null)

  const { data: modelsData, error: modelsError, isLoading: modelsLoading } = useSWR(
    `/api/models?url=${encodeURIComponent(settings.ollamaUrl)}`,
    modelsFetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 30000,
      onSuccess: (data) => {
        if (data?.models?.length > 0 && !selectedModel) {
          const active = conversations.find((c) => c.id === activeConversationId)
          setSelectedModel(active?.model || data.models[0].name)
        }
      },
    }
  )

  const models: OllamaModel[] = modelsData?.models || []

  // Get current model info from the enriched models list
  const currentModelObj = models.find((m) => m.name === selectedModel)
  const detectedContext = currentModelObj?.contextLength || 4096

  // Effective context length:
  // If maxContextLength is set (not 0), respect it but don't exceed model limits.
  // If 0, use detected model context.
  const contextLength =
    settings.maxContextLength > 0 ? Math.min(settings.maxContextLength, detectedContext) : detectedContext

  const canThink = currentModelObj?.capabilities?.includes('thinking') || false
  const canVision = currentModelObj?.capabilities?.includes('vision') || false
  const canTools = currentModelObj?.capabilities?.includes('tools') || false

  // If the model cannot think, disable thinking mode
  useEffect(() => {
    if (!canThink && enableThinking) {
      setEnableThinking(false)
    }
  }, [canThink, enableThinking])

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null

  const persist = useCallback((convs: Conversation[]) => {
    setConversations(convs)
    saveConversations(convs)
  }, [])

  const updateSettings = useCallback((newSettings: ChatSettings) => {
    setSettingsState(newSettings)
    saveSettings(newSettings)
  }, [])

  const newChat = useCallback(() => {
    const model = selectedModel || models[0]?.name || ''
    const conv = createConversation(model, DEFAULT_SYSTEM_PROMPT)
    const updated = [conv, ...conversations]
    persist(updated)
    setActiveConversationId(conv.id)
    return conv.id
  }, [selectedModel, models, conversations, persist])

  const switchConversation = useCallback((id: string) => {
    setActiveConversationId(id)
    const conv = conversations.find((c) => c.id === id)
    if (conv) {
      setSelectedModel(conv.model)
    }
  }, [conversations])

  const deleteConversation = useCallback((id: string) => {
    const updated = conversations.filter((c) => c.id !== id)
    persist(updated)
    if (activeConversationId === id) {
      setActiveConversationId(updated[0]?.id || null)
      if (updated[0]) setSelectedModel(updated[0].model)
    }
  }, [conversations, activeConversationId, persist])

  const renameConversation = useCallback((id: string, title: string) => {
    const updated = conversations.map((c) =>
      c.id === id ? { ...c, title, updatedAt: Date.now() } : c
    )
    persist(updated)
  }, [conversations, persist])

  const updateSystemPrompt = useCallback((prompt: string) => {
    if (!activeConversationId) return
    const updated = conversations.map((c) =>
      c.id === activeConversationId ? { ...c, systemPrompt: prompt, updatedAt: Date.now() } : c
    )
    persist(updated)
  }, [activeConversationId, conversations, persist])

  const editMessage = useCallback((messageId: string, newContent: string) => {
    if (!activeConversationId) return
    const updated = conversations.map((c) => {
      if (c.id !== activeConversationId) return c
      const msgIndex = c.messages.findIndex((m) => m.id === messageId)
      if (msgIndex === -1) return c
      // Remove all messages after the edited one and update it
      const newMessages = c.messages.slice(0, msgIndex).concat({
        ...c.messages[msgIndex],
        content: newContent,
        timestamp: Date.now(),
      })
      return { ...c, messages: newMessages, updatedAt: Date.now() }
    })
    persist(updated)
    return updated.find((c) => c.id === activeConversationId)
  }, [activeConversationId, conversations, persist])

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsGenerating(false)
    setStreamingContent('')
    setStreamingThinking('')
  }, [])

  const executeTool = async (toolName: string, args: any) => {
    try {
      const res = await fetch('/api/execute-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolName, args })
      })
      const data = await res.json()
      return data.result || data.error || 'No result'
    } catch (e: any) {
      return `Error: ${e.message}`
    }
  }

  const sendMessage = useCallback(async (content: string, images?: string[], editedConv?: Conversation) => {
    const model = selectedModel || models[0]?.name
    if (!model) return

    const { TOOL_DEFINITIONS } = await import('@/lib/tool-definitions')

    let convId = activeConversationId
    let currentConversations = editedConv
      ? conversations.map((c) => (c.id === editedConv.id ? editedConv : c))
      : [...conversations]

    if (!convId) {
      const conv = createConversation(model, DEFAULT_SYSTEM_PROMPT)
      convId = conv.id
      currentConversations = [conv, ...currentConversations]
      setActiveConversationId(convId)
    }

    // Only create a user message if content is provided
    let userMessage: Message | null = content ? { ...createMessage('user', content), images } : null

    currentConversations = currentConversations.map((c) => {
      if (c.id !== convId) return c
      const msgs = userMessage ? [...c.messages, userMessage] : [...c.messages]
      const title = c.messages.length === 0 ? generateTitle(msgs) : c.title
      return { ...c, messages: msgs, model, title, updatedAt: Date.now() }
    })
    persist(currentConversations)

    setIsGenerating(true)
    setStreamingContent('')
    if (!enableThinking) {
      setStreamingThinking('')
    }

    const conv = currentConversations.find((c) => c.id === convId)!
    const ollamaMessages = [
      { role: 'system' as const, content: conv.systemPrompt },
      ...conv.messages.map((m) => ({
        role: m.role,
        content: m.content,
        images: m.images,
        tool_calls: m.tool_calls,
        tool_name: m.tool_name
      })),
    ]

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: ollamaMessages,
          model,
          tools: canTools ? TOOL_DEFINITIONS : undefined,
          ollamaUrl: settings.ollamaUrl,
          temperature: settings.temperature,
          topP: settings.topP,
          topK: settings.topK,
          maxTokens: settings.maxTokens,
          repeatPenalty: settings.repeatPenalty,
          seed: settings.seed,
          think: enableThinking,
          numCtx: contextLength,
          stream: true,
        }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const decoder = new TextDecoder()
      let fullContent = ''
      let fullThinking = ''
      let evalCount = 0
      let evalDuration = 0
      let toolCalls: any[] = []
      const startTime = Date.now()

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response stream')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter((l) => l.trim())

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line)
            if (parsed.message?.tool_calls) {
              toolCalls.push(...parsed.message.tool_calls)
            }
            if (parsed.message?.content) {
              fullContent += parsed.message.content
              setStreamingContent(fullContent)
            }
            if (parsed.message?.thinking) {
              fullThinking += parsed.message.thinking
              setStreamingThinking(fullThinking)
            }
            if (parsed.done) {
              evalCount = parsed.eval_count || 0
              evalDuration = parsed.eval_duration || 0
            }
          } catch { }
        }
      }

      const assistantMessage: Message = {
        ...createMessage('assistant', fullContent),
        thinking: enableThinking ? (fullThinking || undefined) : undefined,
        tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
        model,
        tokenCount: evalCount,
        generationTime: Date.now() - startTime,
      }

      const finalConversations = currentConversations.map((c) => {
        if (c.id !== convId) return c
        return { ...c, messages: [...c.messages, assistantMessage], updatedAt: Date.now() }
      })
      persist(finalConversations)

      // AGENT LOOP: If there are tool calls, execute them and continue
      if (toolCalls.length > 0) {
        const nextConversations = [...finalConversations]
        const toolMessages: Message[] = []

        for (const tool of toolCalls) {
          const result = await executeTool(tool.function.name, tool.function.arguments)
          const toolMsg: Message = {
            id: nanoid(),
            role: 'tool',
            content: String(result),
            tool_name: tool.function.name,
            timestamp: Date.now()
          }
          toolMessages.push(toolMsg)
        }

        const updatedConvs = nextConversations.map(c => {
          if (c.id !== convId) return c
          return { ...c, messages: [...c.messages, ...toolMessages], updatedAt: Date.now() }
        })
        persist(updatedConvs)

        // Brief pause then call sendMessage again with empty content to continue turn
        setTimeout(() => {
          sendMessage('', undefined, updatedConvs.find(c => c.id === convId))
        }, 10)

        return
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // User cancelled - save what we have
        if (streamingContent) {
          const partialMessage: Message = {
            ...createMessage('assistant', streamingContent || '(Generation stopped)'),
            thinking: enableThinking ? (streamingThinking || undefined) : undefined,
            model,
          }
          const finalConversations = currentConversations.map((c) => {
            if (c.id !== convId) return c
            return { ...c, messages: [...c.messages, partialMessage], updatedAt: Date.now() }
          })
          persist(finalConversations)
        }
      } else {
        const errorMessage = createMessage('assistant', `**Error:** ${error instanceof Error ? error.message : 'Failed to get response'}`)
        const finalConversations = currentConversations.map((c) => {
          if (c.id !== convId) return c
          return { ...c, messages: [...c.messages, errorMessage], updatedAt: Date.now() }
        })
        persist(finalConversations)
      }
    } finally {
      setIsGenerating(false)
      setStreamingContent('')
      abortControllerRef.current = null
    }
  }, [selectedModel, models, activeConversationId, conversations, persist, settings, streamingContent, enableThinking, contextLength])

  const regenerateLastMessage = useCallback(async () => {
    if (!activeConversation || activeConversation.messages.length < 2) return
    const messages = activeConversation.messages
    const lastUserIndex = messages.length - (messages[messages.length - 1].role === 'assistant' ? 2 : 1)
    const lastUserMsg = messages[lastUserIndex]
    if (!lastUserMsg || lastUserMsg.role !== 'user') return

    // Remove the last assistant message
    const trimmed = messages.slice(0, lastUserIndex)
    const updatedConv = { ...activeConversation, messages: trimmed, updatedAt: Date.now() }
    const updatedConvs = conversations.map((c) => (c.id === activeConversation.id ? updatedConv : c))
    persist(updatedConvs)

    await sendMessage(lastUserMsg.content, undefined, updatedConv)
  }, [activeConversation, conversations, persist, sendMessage])

  const clearConversation = useCallback(() => {
    if (!activeConversationId) return
    const updated = conversations.map((c) =>
      c.id === activeConversationId ? { ...c, messages: [], title: 'New Chat', updatedAt: Date.now() } : c
    )
    persist(updated)
  }, [activeConversationId, conversations, persist])

  return {
    conversations,
    activeConversation,
    activeConversationId,
    settings,
    isGenerating,
    streamingContent,
    streamingThinking,
    selectedModel,
    models,
    modelsLoading,
    modelsError,
    setSelectedModel,
    updateSettings,
    newChat,
    switchConversation,
    deleteConversation,
    renameConversation,
    updateSystemPrompt,
    editMessage,
    sendMessage,
    stopGeneration,
    regenerateLastMessage,
    clearConversation,
    enableThinking,
    setEnableThinking,
    canThink,
    canVision,
    canTools,
  }
}
