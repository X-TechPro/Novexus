'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { OllamaModel } from '@/lib/types'
import { ChevronDown, Cpu, Search, Loader2 } from 'lucide-react'

interface ModelSelectorProps {
  models: OllamaModel[]
  selectedModel: string
  onSelectModel: (model: string) => void
  isLoading: boolean
  error?: string
}

function formatSize(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(0)} MB`
  return `${bytes} B`
}

function formatContext(ctx: number): string {
  if (ctx >= 1000) return `${(ctx / 1024).toFixed(0)}k`
  return `${ctx}`
}

export function ModelSelector({
  models,
  selectedModel,
  onSelectModel,
  isLoading,
  error,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus()
    }
  }, [isOpen])

  const filtered = models.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  )

  const displayName = selectedModel
    ? selectedModel.split(':')[0]
    : 'Select model'

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/50 px-3 py-1.5 text-sm transition-all duration-200 hover:bg-secondary hover:border-border',
          isOpen && 'border-primary/30 bg-secondary'
        )}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        ) : (
          <Cpu className="h-3.5 w-3.5 text-primary/60" />
        )}
        <span className="max-w-[140px] truncate text-foreground/80 font-medium text-[13px]">
          {displayName}
        </span>
        <ChevronDown className={cn('h-3 w-3 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-border bg-popover shadow-xl shadow-background/40 backdrop-blur-xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200">
          {/* Search */}
          <div className="border-b border-border/50 p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search models..."
                className="w-full rounded-lg bg-secondary/50 py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:bg-secondary"
              />
            </div>
          </div>

          {/* Models list */}
          <div className="max-h-64 overflow-y-auto p-1">
            {error ? (
              <div className="px-3 py-6 text-center">
                <p className="text-xs text-destructive/80">Cannot connect to Ollama</p>
                <p className="mt-1 text-[10px] text-muted-foreground/50">Check your Ollama URL in settings</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground/60">
                {isLoading ? 'Loading models...' : 'No models found'}
              </div>
            ) : (
              filtered.map((model) => (
                <button
                  key={model.name}
                  onClick={() => {
                    onSelectModel(model.name)
                    setIsOpen(false)
                    setSearch('')
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                    model.name === selectedModel
                      ? 'bg-primary/10 text-foreground'
                      : 'text-foreground/70 hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Cpu
                    className={cn(
                      'h-4 w-4 shrink-0',
                      model.name === selectedModel ? 'text-primary' : 'text-muted-foreground/40'
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium">{model.name}</div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50">
                      <span>{formatSize(model.size)}</span>
                      {model.details?.parameter_size && (
                        <>
                          <span className="text-border">|</span>
                          <span>{model.details.parameter_size}</span>
                        </>
                      )}
                      {model.details?.quantization_level && (
                        <>
                          <span className="text-border">|</span>
                          <span>{model.details.quantization_level}</span>
                        </>
                      )}
                      {model.contextLength && (
                        <>
                          <span className="text-border">|</span>
                          <span>{formatContext(model.contextLength)} ctx</span>
                        </>
                      )}
                    </div>
                  </div>
                  {model.name === selectedModel && (
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
