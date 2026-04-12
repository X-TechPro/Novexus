'use client'

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Square, Brain, ArrowUp, Paperclip, FileText, ImageIcon, X } from 'lucide-react'

interface ChatInputProps {
  onSend: (content: string, images?: string[]) => void
  onStop: () => void
  isGenerating: boolean
  disabled?: boolean
  enableThinking?: boolean
  onToggleThinking?: (enabled: boolean) => void
  canThink?: boolean
  canVision?: boolean
}

export function ChatInput({
  onSend,
  onStop,
  isGenerating,
  disabled,
  enableThinking = true,
  onToggleThinking,
  canThink = true,
  canVision = false
}: ChatInputProps) {
  const [input, setInput] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [attachedImages, setAttachedImages] = useState<string[]>([])
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

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

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowAttachMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = () => {
    if (isGenerating) {
      onStop()
      return
    }
    const trimmed = input.trim()
    if ((!trimmed && attachedImages.length === 0) || disabled) return

    onSend(trimmed, attachedImages.length > 0 ? attachedImages : undefined)

    setInput('')
    setAttachedImages([])
    setShowAttachMenu(false)

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    for (const file of files) {
      try {
        const text = await file.text()
        const extension = file.name.split('.').pop() || ''
        const codeBlock = `\n\nFile: ${file.name}\n\`\`\`${extension}\n${text}\n\`\`\``
        setInput(prev => prev + codeBlock)
      } catch (err) {
        console.error('Error reading file:', err)
      }
    }
    e.target.value = ''
    setShowAttachMenu(false)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        const base64Data = base64.split(',')[1] || base64
        setAttachedImages(prev => [...prev, base64Data])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
    setShowAttachMenu(false)
  }

  const removeImage = (index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="bg-gradient-to-t from-background via-background/95 to-transparent pt-4 backdrop-blur-sm">
      <div className="mx-auto max-w-3xl px-4 pb-3 md:px-8 lg:px-12 space-y-3">

        {/* Image Previews */}
        {attachedImages.length > 0 && (
          <div className="flex flex-wrap gap-2 px-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {attachedImages.map((img, i) => (
              <div key={i} className="group relative h-20 w-20 overflow-hidden rounded-xl border-2 border-primary/20 bg-secondary/50 shadow-lg">
                <img src={`data:image/jpeg;base64,${img}`} className="h-full w-full object-cover" alt="attachment" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div
          className={cn(
            'relative flex flex-col rounded-2xl border bg-secondary/30 transition-all duration-200',
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
            className="max-h-[300px] min-h-[44px] flex-1 resize-none bg-transparent px-4 py-3 text-base text-foreground leading-relaxed placeholder:text-muted-foreground/40 outline-none disabled:opacity-50"
          />

          {/* Bottom bar */}
          <div className="flex items-center justify-between gap-2 border-t border-border/10 p-1.5 px-3">
            <div className="flex items-center gap-2">
              {/* Paperclip Button */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setShowAttachMenu(!showAttachMenu)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-primary/10 hover:text-primary",
                    showAttachMenu && "bg-primary/20 text-primary"
                  )}
                  title="Attach file"
                >
                  <Paperclip className="h-4 w-4" />
                </button>

                {showAttachMenu && (
                  <div className="absolute bottom-full left-0 mb-3 w-44 overflow-hidden rounded-2xl border border-border bg-card p-1 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/5">
                        <FileText className="h-3.5 w-3.5 text-primary" />
                      </div>
                      Select File (.txt, .py)
                    </button>
                    {canVision && (
                      <button
                        onClick={() => imageInputRef.current?.click()}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
                      >
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/5">
                          <ImageIcon className="h-3.5 w-3.5 text-primary" />
                        </div>
                        Select Image
                      </button>
                    )}
                  </div>
                )}
              </div>

              {onToggleThinking && canThink && (
                <button
                  onClick={() => onToggleThinking(!enableThinking)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all duration-200',
                    enableThinking
                      ? 'bg-primary/15 text-primary hover:bg-primary/20 shadow-[0_0_10px_-2px_rgba(var(--primary),0.3)]'
                      : 'bg-secondary/50 text-muted-foreground/60 hover:bg-accent hover:text-accent-foreground'
                  )}
                  title={enableThinking ? 'Disable reasoning' : 'Enable reasoning'}
                >
                  <Brain className={cn('h-3.5 w-3.5 transition-all', enableThinking && 'fill-primary/20 animate-pulse')} />
                  <span>Reasoning</span>
                </button>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={(!isGenerating && (!input.trim() && attachedImages.length === 0)) || disabled}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200',
                isGenerating
                  ? 'bg-destructive/15 text-destructive hover:bg-destructive/25 hover:scale-105'
                  : (input.trim() || attachedImages.length > 0)
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95'
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

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".txt,.py"
        multiple
        onChange={handleFileSelect}
      />
      <input
        type="file"
        ref={imageInputRef}
        className="hidden"
        accept="image/*"
        multiple
        onChange={handleImageSelect}
      />
    </div>
  )
}
