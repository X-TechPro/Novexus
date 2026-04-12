'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { ChatSettings } from '@/lib/types'
import { X, Server, Sliders, Save } from 'lucide-react'

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
  settings: ChatSettings
  onSave: (settings: ChatSettings) => void
  systemPrompt: string
  onSaveSystemPrompt: (prompt: string) => void
}

export function SettingsDialog({
  isOpen,
  onClose,
  settings,
  onSave,
  systemPrompt,
  onSaveSystemPrompt,
}: SettingsDialogProps) {
  const [local, setLocal] = useState(settings)
  const [localPrompt, setLocalPrompt] = useState(systemPrompt)
  const [tab, setTab] = useState<'connection' | 'generation' | 'system'>('connection')

  useEffect(() => {
    setLocal(settings)
    setLocalPrompt(systemPrompt)
  }, [settings, systemPrompt, isOpen])

  if (!isOpen) return null

  const handleSave = () => {
    onSave(local)
    onSaveSystemPrompt(localPrompt)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-background/50 animate-in fade-in-0 zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border p-5">
            <h2 className="text-base font-semibold text-foreground">Settings</h2>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            {[
              { id: 'connection' as const, label: 'Connection', icon: Server },
              { id: 'generation' as const, label: 'Generation', icon: Sliders },
              { id: 'system' as const, label: 'System Prompt', icon: Sliders },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors',
                  tab === t.id
                    ? 'border-b-2 border-primary text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="max-h-[400px] overflow-y-auto p-5">
            {tab === 'connection' && (
              <div className="flex flex-col gap-4">
                <SettingField label="Ollama URL" description="The URL of your Ollama instance">
                  <input
                    value={local.ollamaUrl}
                    onChange={(e) => setLocal({ ...local, ollamaUrl: e.target.value })}
                    className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary/50"
                    placeholder="http://localhost:11434"
                  />
                </SettingField>
              </div>
            )}

            {tab === 'generation' && (
              <div className="flex flex-col gap-5">
                <SliderField
                  label="Temperature"
                  description="Higher values produce more creative responses"
                  value={local.temperature}
                  min={0}
                  max={2}
                  step={0.1}
                  onChange={(v) => setLocal({ ...local, temperature: v })}
                />
                <SliderField
                  label="Top P"
                  description="Nucleus sampling threshold"
                  value={local.topP}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => setLocal({ ...local, topP: v })}
                />
                <SliderField
                  label="Top K"
                  description="Limits vocabulary to top K tokens"
                  value={local.topK}
                  min={1}
                  max={100}
                  step={1}
                  onChange={(v) => setLocal({ ...local, topK: v })}
                />
                <SliderField
                  label="Max Tokens"
                  description="Maximum response length"
                  value={local.maxTokens}
                  min={256}
                  max={32768}
                  step={256}
                  onChange={(v) => setLocal({ ...local, maxTokens: v })}
                />
                <SettingField
                  label="Max Context Length"
                  description="Overrides model limit. Set to 0 for automatic detection based on model metadata."
                >
                  <input
                    type="number"
                    value={local.maxContextLength}
                    onChange={(e) => setLocal({ ...local, maxContextLength: Number(e.target.value) })}
                    className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary/50"
                    placeholder="0 (Auto)"
                    min={0}
                  />
                </SettingField>
                <SliderField
                  label="Repeat Penalty"
                  description="Penalizes repeated tokens"
                  value={local.repeatPenalty}
                  min={1}
                  max={2}
                  step={0.05}
                  onChange={(v) => setLocal({ ...local, repeatPenalty: v })}
                />
              </div>
            )}

            {tab === 'system' && (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-muted-foreground">
                  Customize the system prompt that guides the AI behavior for this conversation.
                </p>
                <textarea
                  value={localPrompt}
                  onChange={(e) => setLocalPrompt(e.target.value)}
                  rows={8}
                  className="w-full resize-none rounded-xl border border-border bg-input p-3 text-sm text-foreground leading-relaxed outline-none transition-colors focus:border-primary/50"
                  placeholder="You are a helpful AI assistant..."
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-border p-4">
            <button
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Save className="h-3.5 w-3.5" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function SettingField({
  label,
  description,
  children,
}: {
  label: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <p className="text-[11px] text-muted-foreground/60">{description}</p>
      {children}
    </div>
  )
}

function SliderField({
  label,
  description,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  description: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-foreground">{label}</label>
          <p className="text-[10px] text-muted-foreground/50">{description}</p>
        </div>
        <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-mono font-medium text-foreground">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  )
}
