'use client'

import { useRef, useEffect, useCallback } from 'react'
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

  // Track if we should auto-scroll
  const shouldAutoScroll = useRef(true)

  // Handle scroll events to detect manual scrolling
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current
      // If we are within 100px of the bottom, enable auto-scroll
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100
      shouldAutoScroll.current = isAtBottom
    }
  }, [])

  // Auto-scroll to bottom on new messages or streaming
  useEffect(() => {
    // Re-enable auto-scroll when new content arrives during generation
    if (isGenerating || streamingContent) {
      shouldAutoScroll.current = true
    }

    if (shouldAutoScroll.current && bottomRef.current) {
      // Use 'auto' behavior during generation to prevent 'smooth' jittering
      // while content is rapidly being added.
      bottomRef.current.scrollIntoView({ behavior: isGenerating ? 'auto' : 'smooth' })
    }
  }, [messages, streamingContent, isGenerating])

  // Attach scroll listener
  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto">
      {messages.length === 0 ? (
        <WelcomeScreen onSuggestionClick={onSuggestionClick} hasModels={hasModels} />
      ) : (
        <div className="py-6">
          {messages.map((message, index) => {
            const prevMessage = index > 0 ? messages[index - 1] : null
            const isContinuation = !!prevMessage && prevMessage.role !== 'user' && message.role !== 'user'

            return (
              <ChatMessage
                key={message.id}
                message={message}
                isLast={index === messages.length - 1}
                isContinuation={isContinuation}
                onEdit={message.role === 'user' ? onEdit : undefined}
                onRegenerate={onRegenerate}
              />
            )
          })}

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
              isContinuation={messages.length > 0 && messages[messages.length - 1].role !== 'user'}
              streamingContent={streamingContent}
              streamingThinking={streamingThinking}
            />
          )}
        </div>
      )}

      <div ref={bottomRef} className="h-4" />
    </div>
  )
}
