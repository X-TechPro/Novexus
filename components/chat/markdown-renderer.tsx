'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeHighlight from 'rehype-highlight'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import 'katex/dist/katex.min.css'
import { CodeBlock } from './code-block'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

interface MarkdownRendererProps {
  content: string
  isStreaming?: boolean
}

// Helper to extract plain text from React nodes
function extractText(children: ReactNode): string {
  if (typeof children === 'string') return children
  if (typeof children === 'number') return String(children)
  if (Array.isArray(children)) return children.map(extractText).join('')
  if (children && typeof children === 'object' && 'props' in children) {
    return extractText((children as any).props?.children)
  }
  return ''
}

// Custom plugin to add an inline blinking cursor at the end of the text
const addCursorPlugin = () => (tree: any) => {
  if (!tree.children) return

  let lastTextNode: any = null
  let parentOfLastTextNode: any = null

  // Helper to recursively find the very last text node
  const findLastTextNode = (node: any, parent: any = null) => {
    if (node.type === 'text') {
      lastTextNode = node
      parentOfLastTextNode = parent
    } else if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        findLastTextNode(node.children[i], node)
      }
    }
  }

  findLastTextNode(tree)

  const cursorNode = {
    type: 'element',
    tagName: 'span',
    properties: {
      className: ['inline-block', 'w-[2px]', 'h-4', 'bg-primary', 'ml-1', 'align-middle', 'animate-pulse']
    },
    children: []
  }

  if (parentOfLastTextNode) {
    // Append the cursor node inside the same parent as the last text node
    parentOfLastTextNode.children.push(cursorNode)
  } else {
    // If there's no text yet, append it directly to the root
    tree.children.push(cursorNode)
  }
}

export function MarkdownRenderer({ content, isStreaming }: MarkdownRendererProps) {
  return (
    <div className={`prose max-w-none text-foreground/90 ${isStreaming ? 'streaming-cursor' : ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          rehypeRaw,
          rehypeHighlight,
          [rehypeKatex, { output: 'htmlAndMathml' }] as any,
          ...(isStreaming ? [addCursorPlugin] : [])
        ]}
        components={{
          pre({ children }) {
            return <>{children}</>
          },
          code(props: ComponentPropsWithoutRef<'code'> & { className?: string; children?: React.ReactNode }) {
            const { className, children, ...rest } = props
            const match = /language-(\w+)/.exec(className || '')
            // Extract text content properly from React nodes
            const content = extractText(children)

            // Check if this is a block code (has language class or is multi-line)
            const isBlock = match || content.includes('\n')

            if (isBlock) {
              return (
                <CodeBlock language={match?.[1]}>{content}</CodeBlock>
              )
            }

            return (
              <code className={className} {...rest}>
                {children}
              </code>
            )
          },
          table({ children }) {
            return (
              <div className="my-6 overflow-hidden rounded-xl border border-border shadow-sm bg-card/20">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    {children}
                  </table>
                </div>
              </div>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
