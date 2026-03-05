'use client'

import { useRef, useEffect } from 'react'
import type { Message } from '@/lib/types'
import { ChatMessage } from './chat-message'
import { WelcomeScreen } from './welcome-screen'

interface ChatAreaProps {
  messages: Message[]
  isGenerating: boolean
  streamingContent: string
  streamingThinking: string
  hasModels: boolean
  onEdit: (messageId: string, content: string) => void
  onRegenerate: () => void
  onSuggestionClick: (text: string) => void
}

export function ChatArea({
  messages,
  isGenerating,
  streamingContent,
  streamingThinking,
  hasModels,
  onEdit,
  onRegenerate,
  onSuggestionClick,
}: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages or streaming
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, streamingContent, isGenerating])

  if (messages.length === 0) {
    return <WelcomeScreen onSuggestionClick={onSuggestionClick} hasModels={hasModels} />
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto">
      <div className="py-6">
        {messages.map((message, index) => (
          <ChatMessage
            key={message.id}
            message={message}
            isLast={index === messages.length - 1}
            onEdit={message.role === 'user' ? onEdit : undefined}
            onRegenerate={onRegenerate}
          />
        ))}

        {/* Streaming message */}
        {isGenerating && (
          <ChatMessage
            message={{
              id: 'streaming',
              role: 'assistant',
              content: '',
              timestamp: Date.now(),
            }}
            isLast={true}
            isStreaming={true}
            streamingContent={streamingContent}
            streamingThinking={streamingThinking}
          />
        )}
      </div>

      <div ref={bottomRef} className="h-4" />
    </div>
  )
}
