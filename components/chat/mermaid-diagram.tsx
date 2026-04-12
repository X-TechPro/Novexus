'use client'

import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { Loader2 } from 'lucide-react'

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
})

// Silence internal mermaid error logging to console
mermaid.parseError = () => {}

export function MermaidDiagram({ code, hasCursor, isStreaming }: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isRendered, setIsRendered] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const idRef = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`)
  const renderedCodeRef = useRef<string>('')

  // Handle hydration
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return
    
    // EXTREMELY IMPORTANT: Do not render if the AI is still writing inside this block
    // or if we already rendered this exact code
    const clean = cleanupCode(code)
    if (hasCursor) return 
    if (isRendered && renderedCodeRef.current === clean) return
    
    let isMounted = true
    
    const attemptRender = async () => {
      if (!clean) return

      try {
        // Double check cursor right before rendering in case it changed during async
        if (hasCursor) return

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
          setError('Invalid diagram syntax. Please check the Mermaid code.')
          setIsRendered(false)
        }
      }
    }

    // Always delay slightly to ensure DOM is ready and cursor has truly left the block
    const timeout = setTimeout(attemptRender, 50)

    return () => {
      isMounted = false
      clearTimeout(timeout)
    }
  }, [code, hasCursor, isStreaming, isClient])

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
      <div className="my-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive shadow-sm">
        <div className="font-semibold mb-2 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-destructive" />
          Diagram Rendering Error
        </div>
        <p className="opacity-80 mb-3">{error}</p>
        <pre className="text-[10px] opacity-70 overflow-x-auto p-3 bg-black/20 rounded-lg border border-destructive/10">
          {code}
        </pre>
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
