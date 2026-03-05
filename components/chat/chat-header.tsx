'use client'

import type { OllamaModel } from '@/lib/types'
import { ModelSelector } from './model-selector'
import { Menu, Trash2, FileText } from 'lucide-react'

interface ChatHeaderProps {
  models: OllamaModel[]
  selectedModel: string
  onSelectModel: (model: string) => void
  modelsLoading: boolean
  modelsError?: string
  onOpenSidebar: () => void
  onClearChat: () => void
  hasMessages: boolean
  conversationTitle: string
}

export function ChatHeader({
  models,
  selectedModel,
  onSelectModel,
  modelsLoading,
  modelsError,
  onOpenSidebar,
  onClearChat,
  hasMessages,
  conversationTitle,
}: ChatHeaderProps) {
  return (
    <header className="relative z-10 flex items-center justify-between bg-background/80 px-4 py-2.5 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Menu className="h-5 w-5" />
        </button>

        <ModelSelector
          models={models}
          selectedModel={selectedModel}
          onSelectModel={onSelectModel}
          isLoading={modelsLoading}
          error={modelsError}
        />

        {hasMessages && (
          <div className="hidden items-center gap-1.5 md:flex">
            <span className="text-border">|</span>
            <FileText className="h-3 w-3 text-muted-foreground/40" />
            <span className="max-w-[200px] truncate text-xs text-muted-foreground/50">
              {conversationTitle}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        {hasMessages && (
          <button
            onClick={onClearChat}
            className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            title="Clear conversation"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>
    </header>
  )
}
