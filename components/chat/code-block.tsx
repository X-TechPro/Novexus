'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Check, Copy, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import hljs from 'highlight.js'

interface CodeBlockProps {
  children: string
  language?: string
  className?: string
  hasCursor?: boolean
}

export function CodeBlock({ children, language, className, hasCursor }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [highlighted, setHighlighted] = useState('')
  const codeRef = useRef<HTMLElement>(null)
  const lines = children.split('\n')
  const isLong = lines.length > 30

  useEffect(() => {
    // Use highlight.js to highlight the code
    const lang = language || 'plaintext'
    const code = children.replace(/\n$/, '')

    try {
      const result = hljs.highlight(code, { language: lang })
      setHighlighted(result.value)
    } catch {
      // Fallback to auto-detection
      const result = hljs.highlightAuto(code)
      setHighlighted(result.value)
    }
  }, [children, language])

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
      <div className={cn('overflow-x-auto', collapsed && 'max-h-[120px] overflow-y-hidden')}>
        <pre className="!m-0 !border-0 !bg-transparent !p-0">
          <code
            ref={codeRef}
            className={cn('block px-4 py-3 font-mono text-[13px] leading-relaxed', language && `language-${language}`)}
          >
            <span dangerouslySetInnerHTML={{ __html: highlighted || children }} />
            {hasCursor && (
              <span className="inline-block w-[2px] h-4 bg-primary ml-1 align-middle" />
            )}
          </code>
        </pre>
      </div>

      {/* Collapsed gradient overlay */}
      {collapsed && isLong && (
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[oklch(0.11_0.005_260)] to-transparent" />
      )}
    </div>
  )
}
