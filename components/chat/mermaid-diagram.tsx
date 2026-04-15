'use client'

import { useEffect, useRef, useState, useId } from 'react'
import mermaid from 'mermaid'
import { Loader2, AlertCircle } from 'lucide-react'

interface MermaidDiagramProps {
  code: string
  hasCursor?: boolean
  isStreaming?: boolean
}

function cleanupCode(code: string): string {
  let cleaned = code.trim()
  // AI often makes this mistake: stateDiagram-diagram
  cleaned = cleaned.replace(/^stateDiagram-diagram/, 'stateDiagram-v2')
  // Remove any stray trailing backticks that might be caught in the block
  cleaned = cleaned.replace(/`+$/, '')
  return cleaned
}

// Global initialization
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'var(--font-mono)',
  logLevel: 'error',
  suppressErrorRendering: true,
})

// Silence internal mermaid error logging to console
mermaid.parseError = (err, hash) => {
  // We handle errors manually in the component
}

export function MermaidDiagram({ code, hasCursor, isStreaming }: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isRendered, setIsRendered] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [queuedCode, setQueuedCode] = useState<string | null>(null)

  // Use a stable ID for hydration safety
  const reactId = useId().replace(/:/g, '-')
  const idRef = useRef(`mermaid-${reactId}`)
  const renderedCodeRef = useRef<string>('')

  // Handle hydration
  useEffect(() => {
    setIsClient(true)
  }, [])

  // During streaming, just track the latest code but don't render yet
  useEffect(() => {
    if (isStreaming) {
      setQueuedCode(cleanupCode(code))
      return
    }

    // Streaming finished - render the queued code
    if (!isClient) return
    const clean = queuedCode || cleanupCode(code)
    if (!clean) return

    let isMounted = true

    const attemptRender = async () => {
      try {
        // Validate syntax first to avoid Mermaid's internal error handling
        const isValid = await mermaid.parse(clean, { suppressErrors: true })
        if (!isValid && isMounted) {
          setError('Invalid diagram syntax. Please check the Mermaid code.')
          setIsRendered(false)
          return
        }

        // Perform the full render
        const { svg: renderedSvg } = await mermaid.render(idRef.current, clean)

        if (isMounted) {
          setSvg(renderedSvg)
          setIsRendered(true)
          setError(null)
          renderedCodeRef.current = clean
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Mermaid render error:', err)
          setError('Failed to render diagram. Please check the syntax.')
          setIsRendered(false)
        }
      }
    }

    const timeout = setTimeout(attemptRender, 50)

    return () => {
      isMounted = false
      clearTimeout(timeout)
    }
  }, [isStreaming, isClient, queuedCode, code])

  // Hydration safety: render a placeholder with the same dimensions on server
  if (!isClient) {
    return (
      <div className="my-6 flex min-h-[120px] w-full items-center justify-center rounded-xl border border-dashed border-border bg-card/5 animate-pulse">
        <Loader2 className="h-5 w-5 text-muted-foreground/20" />
      </div>
    )
  }

  if (error && !hasCursor) {
    return (
      <div className="my-4 overflow-hidden rounded-xl border border-destructive/20 bg-destructive/5 text-xs text-destructive shadow-sm">
        <div className="flex items-center gap-2 bg-destructive/10 px-4 py-2 font-semibold">
          <AlertCircle className="h-3.5 w-3.5" />
          Diagram Rendering Error
        </div>
        <div className="p-4 leading-relaxed">
          <p className="mb-2 font-medium opacity-90">{error}</p>
          <pre className="mt-2 max-h-[150px] overflow-auto rounded-lg border border-destructive/10 bg-black/20 p-3 text-[10px] opacity-70">
            {code}
          </pre>
        </div>
      </div>
    )
  }

  return (
    <div className="relative my-8 flex min-h-[100px] w-full flex-col items-center justify-center rounded-xl border border-border bg-card/10 p-6 backdrop-blur-sm transition-all duration-300">
      {(!isRendered) && (
        <div className="flex flex-col items-center gap-3 py-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              {hasCursor ? 'AI is drawing...' : 'Initializing diagram...'}
            </span>
            {hasCursor && (
              <span className="text-[10px] text-muted-foreground/40 text-center max-w-[200px]">
                Diagram will appear once the syntax is valid
              </span>
            )}
          </div>
        </div>
      )}

      {isRendered && (
        <div
          className="w-full overflow-x-auto flex justify-center mermaid-rendered select-none"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}
    </div>
  )
}
