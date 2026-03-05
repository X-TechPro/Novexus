'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { Message } from '@/lib/types'
import { MarkdownRenderer } from './markdown-renderer'
import { StreamingText } from './streaming-text'
import { ReasoningBlock } from './reasoning-block'
import {
  Copy,
  Check,
  Pencil,
  RotateCcw,
  User,
  Bot,
  Zap,
  X,
} from 'lucide-react'

interface ChatMessageProps {
  message: Message
  isLast: boolean
  isStreaming?: boolean
  streamingContent?: string
  streamingThinking?: string
  onEdit?: (messageId: string, content: string) => void
  onRegenerate?: () => void
}

export function ChatMessage({
  message,
  isLast,
  isStreaming,
  streamingContent,
  streamingThinking,
  onEdit,
  onRegenerate,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const editRef = useRef<HTMLTextAreaElement>(null)

  const isUser = message.role === 'user'

  // Get thinking content - from streaming or saved message
  const thinking = isStreaming ? (streamingThinking || message.thinking) : message.thinking
  const content = isStreaming ? streamingContent : message.content

  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus()
      editRef.current.style.height = 'auto'
      editRef.current.style.height = editRef.current.scrollHeight + 'px'
    }
  }, [isEditing])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { }
  }, [content])

  const handleEditSubmit = () => {
    if (editContent.trim() && onEdit) {
      onEdit(message.id, editContent.trim())
    }
    setIsEditing(false)
  }

  const handleEditCancel = () => {
    setEditContent(message.content)
    setIsEditing(false)
  }

  const tokenInfo = message.tokenCount && message.generationTime
    ? `${message.tokenCount} tokens | ${(message.generationTime / 1000).toFixed(1)}s | ${(message.tokenCount / (message.generationTime / 1000)).toFixed(0)} tok/s`
    : null

  return (
    <div
      className={cn(
        'group relative px-4 py-3 md:px-8 lg:px-12',
      )}
    >
      <div className="mx-auto flex max-w-4xl gap-4">
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-xl text-xs font-medium',
              isUser
                ? 'bg-primary/15 text-primary'
                : 'bg-accent text-accent-foreground'
            )}
          >
            {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Role label */}
          <div className="mb-1.5 flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground/80">
              {isUser ? 'You' : message.model || 'Assistant'}
            </span>
          </div>

          {/* Thinking block */}
          {thinking && <ReasoningBlock thinking={thinking} />}

          {/* Message body */}
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <textarea
                ref={editRef}
                value={editContent}
                onChange={(e) => {
                  setEditContent(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = e.target.scrollHeight + 'px'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleEditSubmit()
                  }
                  if (e.key === 'Escape') handleEditCancel()
                }}
                className="min-h-[60px] w-full resize-none rounded-xl border border-border bg-input p-3 text-sm text-foreground leading-relaxed outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleEditSubmit}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Check className="h-3 w-3" />
                  Save & Submit
                </button>
                <button
                  onClick={handleEditCancel}
                  className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
                >
                  <X className="h-3 w-3" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {isUser ? (
                <div className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {content}
                </div>
              ) : (
                <div className={cn('text-base leading-relaxed', isStreaming && 'streaming-content')}>
                  {content ? (
                    <span className="inline">
                      {isStreaming ? (
                        <StreamingText content={content} isStreaming={isStreaming} />
                      ) : (
                        <MarkdownRenderer content={content} />
                      )}
                    </span>
                  ) : isStreaming ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="flex gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                        <span className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                        <span className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                      </div>
                      <span className="text-xs">{thinking ? 'Thinking...' : 'Generating...'}</span>
                    </div>
                  ) : null}
                </div>
              )}
            </>
          )}

          {/* Token stats */}
          {!isUser && tokenInfo && !isStreaming && (
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground/40">
              <Zap className="h-2.5 w-2.5" />
              <span>{tokenInfo}</span>
            </div>
          )}

          {/* Action buttons */}
          {!isEditing && !isStreaming && (
            <div className="mt-1.5 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <ActionButton
                icon={copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                label={copied ? 'Copied' : 'Copy'}
                onClick={handleCopy}
              />
              {isUser && onEdit && (
                <ActionButton
                  icon={<Pencil className="h-3 w-3" />}
                  label="Edit"
                  onClick={() => {
                    setEditContent(message.content)
                    setIsEditing(true)
                  }}
                />
              )}
              {!isUser && isLast && onRegenerate && (
                <ActionButton
                  icon={<RotateCcw className="h-3 w-3" />}
                  label="Regenerate"
                  onClick={onRegenerate}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] text-muted-foreground transition-all duration-150 hover:bg-accent hover:text-accent-foreground"
      title={label}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
