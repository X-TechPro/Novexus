'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { Check, Copy, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import hljs from 'highlight.js'

interface CodeBlockProps {
  children: string
  language?: string
  className?: string
  hasCursor?: boolean
}

function splitHighlightedCodeIntoLines(html: string): string[] {
  if (!html) return []
  const rawLines = html.split('\n')
  const openTags: string[] = []
  const result: string[] = []

  for (const rawLine of rawLines) {
    let currentLine = openTags.join('')
    let i = 0
    while (i < rawLine.length) {
      if (rawLine[i] === '<') {
        const closeIndex = rawLine.indexOf('>', i)
        if (closeIndex !== -1) {
          const tag = rawLine.slice(i, closeIndex + 1)
          if (tag.startsWith('</')) {
            openTags.pop()
          } else if (!tag.endsWith('/>')) {
            openTags.push(tag)
          }
          currentLine += tag
          i = closeIndex + 1
          continue
        }
      }
      currentLine += rawLine[i]
      i++
    }
    currentLine += '</span>'.repeat(openTags.length)
    result.push(currentLine)
  }

  return result
}

export function CodeBlock({ children, language, className, hasCursor }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const highlighted = useMemo(() => {
    // Use highlight.js to highlight the code
    const lang = language || 'plaintext'
    const code = children.replace(/\n$/, '')

    try {
      const result = hljs.highlight(code, { language: lang })
      return result.value
    } catch {
      // Fallback to auto-detection
      try {
        const result = hljs.highlightAuto(code)
        return result.value
      } catch {
        return ''
      }
    }
  }, [children, language])

  const codeRef = useRef<HTMLDivElement>(null)
  const lines = useMemo(() => children.replace(/\n$/, '').split('\n'), [children])
  const highlightedLines = useMemo(() => {
    if (!highlighted) return []
    return splitHighlightedCodeIntoLines(highlighted)
  }, [highlighted])

  const isLong = lines.length > 30

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(children)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const textarea = document.createElement('textarea')
      textarea.value = children
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [children])

  return (
    <div className={cn('group/code relative my-3 overflow-hidden rounded-xl border border-border bg-[oklch(0.11_0.005_260)]', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 bg-[oklch(0.14_0.006_260)] px-4 py-2">
        <span className="font-mono text-[11px] font-medium text-muted-foreground">
          {language || 'text'}
        </span>
        <div className="flex items-center gap-1">
          {isLong && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {collapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
              {collapsed ? 'Expand' : 'Collapse'}
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-accent-foreground"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code content */}
      <div className={cn('overflow-x-auto py-3', collapsed && 'max-h-[120px] overflow-y-hidden')}>
        <div ref={codeRef} className="table w-full border-collapse font-mono text-[13px] leading-relaxed">
          {lines.map((rawLineText, i) => {
            const lineHtml = highlightedLines[i] || rawLineText
            const isLastLine = i === lines.length - 1
            return (
              <div key={i} className="table-row">
                <div className="table-cell sticky left-0 z-10 select-none px-3 text-right align-baseline text-muted-foreground/35 border-r border-border/40 bg-[oklch(0.12_0.005_260)] w-[1%] whitespace-nowrap">
                  {i + 1}
                </div>
                <div className="table-cell pl-4 pr-4 align-baseline whitespace-pre">
                  <span dangerouslySetInnerHTML={{ __html: lineHtml || ' ' }} />
                  {isLastLine && hasCursor && (
                    <span className="inline-block w-[2px] h-4 bg-primary ml-1 align-middle" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Collapsed gradient overlay */}
      {collapsed && isLong && (
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[oklch(0.11_0.005_260)] to-transparent" />
      )}
    </div>
  )
}
