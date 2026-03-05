'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { Conversation } from '@/lib/types'
import {
  Plus,
  MessageSquare,
  Trash2,
  Pencil,
  Check,
  X,
  Search,
  Settings,
  ChevronLeft,
} from 'lucide-react'

interface ChatSidebarProps {
  conversations: Conversation[]
  activeConversationId: string | null
  onNewChat: () => void
  onSwitchConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
  onRenameConversation: (id: string, title: string) => void
  onOpenSettings: () => void
  isOpen: boolean
  onClose: () => void
}

export function ChatSidebar({
  conversations,
  activeConversationId,
  onNewChat,
  onSwitchConversation,
  onDeleteConversation,
  onRenameConversation,
  onOpenSettings,
  isOpen,
  onClose,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingId])

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.messages.some((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const grouped = groupByDate(filtered)

  function startRename(conv: Conversation) {
    setEditingId(conv.id)
    setEditTitle(conv.title)
  }

  function confirmRename() {
    if (editingId && editTitle.trim()) {
      onRenameConversation(editingId, editTitle.trim())
    }
    setEditingId(null)
    setEditTitle('')
  }

  function cancelRename() {
    setEditingId(null)
    setEditTitle('')
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-sidebar backdrop-blur-xl transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-primary">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-sm font-semibold text-sidebar-foreground tracking-tight">Novexus AI</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="px-3 pb-2">
          <button
            onClick={() => { onNewChat(); onClose(); }}
            className="flex w-full items-center gap-2.5 rounded-xl border border-border/50 bg-accent/40 px-3.5 py-2.5 text-sm font-medium text-accent-foreground transition-all duration-200 hover:bg-accent hover:border-border"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-transparent bg-secondary/50 py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-border focus:bg-secondary focus:outline-none"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {Object.entries(grouped).map(([label, convs]) => (
            <div key={label} className="mb-3">
              <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {label}
              </div>
              {convs.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    'group relative flex items-center rounded-lg px-2.5 py-2 text-sm transition-all duration-150 cursor-pointer',
                    conv.id === activeConversationId
                      ? 'bg-accent text-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-accent/50 hover:text-sidebar-foreground'
                  )}
                  onClick={() => {
                    if (editingId !== conv.id) {
                      onSwitchConversation(conv.id)
                      onClose()
                    }
                  }}
                >
                  <MessageSquare className="mr-2.5 h-3.5 w-3.5 shrink-0 opacity-50" />
                  {editingId === conv.id ? (
                    <div className="flex flex-1 items-center gap-1">
                      <input
                        ref={editInputRef}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') confirmRename()
                          if (e.key === 'Escape') cancelRename()
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 rounded-md bg-input px-2 py-0.5 text-xs text-foreground outline-none"
                      />
                      <button
                        onClick={(e) => { e.stopPropagation(); confirmRename() }}
                        className="flex h-5 w-5 items-center justify-center rounded text-primary hover:bg-primary/15"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); cancelRename() }}
                        className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 truncate text-[13px]">{conv.title}</span>
                      <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={(e) => { e.stopPropagation(); startRename(conv) }}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteConversation(conv.id) }}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="mb-2 h-8 w-8 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground/60">
                {searchQuery ? 'No matching conversations' : 'No conversations yet'}
              </p>
            </div>
          )}
        </div>

        {/* Settings button */}
        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={onOpenSettings}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </div>
      </aside>
    </>
  )
}

function groupByDate(conversations: Conversation[]): Record<string, Conversation[]> {
  const now = Date.now()
  const day = 86400000
  const groups: Record<string, Conversation[]> = {}

  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt)

  for (const conv of sorted) {
    const age = now - conv.updatedAt
    let label: string

    if (age < day) {
      label = 'Today'
    } else if (age < day * 2) {
      label = 'Yesterday'
    } else if (age < day * 7) {
      label = 'This Week'
    } else if (age < day * 30) {
      label = 'This Month'
    } else {
      label = 'Older'
    }

    if (!groups[label]) groups[label] = []
    groups[label].push(conv)
  }

  return groups
}
