'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Square, Brain, ArrowUp } from 'lucide-react'

interface ChatInputProps {
  onSend: (content: string) => void
  onStop: () => void
  isGenerating: boolean
  disabled?: boolean
  enableThinking?: boolean
  onToggleThinking?: (enabled: boolean) => void
}

export function ChatInput({ onSend, onStop, isGenerating, disabled, enableThinking = true, onToggleThinking }: ChatInputProps) {
  const [input, setInput] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
  }, [input])

  // Focus on mount
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleSubmit = () => {
    if (isGenerating) {
      onStop()
      return
    }
    const trimmed = input.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setInput('')
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="bg-gradient-to-t from-background via-background/95 to-transparent pt-4 backdrop-blur-sm">
      <div className="mx-auto max-w-3xl px-4 pb-3 md:px-8 lg:px-12">
        <div
          className={cn(
            'relative flex flex-col rounded-2xl border bg-secondary/30 p-1.5 transition-all duration-200',
            isFocused
              ? 'border-primary/40 bg-secondary/50 shadow-xl shadow-primary/10'
              : 'border-border/50 bg-secondary/30 shadow-lg shadow-background/20',
            disabled && 'opacity-60'
          )}
        >
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={enableThinking ? "Ask anything... reasoning will be shown" : "Ask anything..."}
            disabled={disabled}
            rows={1}
            className="max-h-[200px] min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2 text-base text-foreground leading-relaxed placeholder:text-muted-foreground/40 outline-none disabled:opacity-50"
          />

          {/* Bottom bar with reasoning toggle and send button */}
          <div className="flex items-center justify-between px-1.5 pt-1.5">
            {onToggleThinking && (
              <button
                onClick={() => onToggleThinking(!enableThinking)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all duration-200',
                  enableThinking
                    ? 'bg-primary/15 text-primary hover:bg-primary/20'
                    : 'bg-secondary text-muted-foreground/60 hover:bg-accent/50 hover:text-accent-foreground'
                )}
                title={enableThinking ? 'Disable reasoning' : 'Enable reasoning'}
              >
                <Brain className={cn('h-3.5 w-3.5 transition-all', enableThinking && 'fill-primary/20')} />
                <span>Reasoning</span>
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={(!isGenerating && (!input.trim() || disabled))}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200',
                isGenerating
                  ? 'bg-destructive/15 text-destructive hover:bg-destructive/25 hover:scale-105'
                  : input.trim()
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/25 hover:scale-105'
                    : 'bg-secondary text-muted-foreground/40 cursor-not-allowed'
              )}
            >
              {isGenerating ? (
                <Square className="h-4 w-4" fill="currentColor" />
              ) : (
                <ArrowUp className="h-5 w-5 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
