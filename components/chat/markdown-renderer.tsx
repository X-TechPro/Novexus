'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeHighlight from 'rehype-highlight'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import 'katex/dist/katex.min.css'
import { CodeBlock } from './code-block'
import { MermaidDiagram } from './mermaid-diagram'
import React, { type ComponentPropsWithoutRef, type ReactNode } from 'react'

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

const addCursorPlugin = () => (tree: any) => {
  const cursorNode = {
    type: 'element',
    tagName: 'span',
    properties: {
      className: ['inline-block', 'w-[2px]', 'h-[1em]', 'bg-primary', 'ml-0.5', 'translate-y-[0.1em]', 'animate-pulse'],
      'data-cursor': true
    },
    children: []
  }

  const voidElements = ['br', 'hr', 'img', 'input', 'link', 'meta']

  function injectCursor(node: any): boolean {
    if (!node.children || node.children.length === 0) {
      node.children = [cursorNode]
      return true
    }

    // Find the last "meaningful" child (skip trailing whitespace/newlines)
    let lastChildIndex = node.children.length - 1
    while (lastChildIndex >= 0) {
      const child = node.children[lastChildIndex]
      if (child.type === 'text' && (child.value === '\n' || child.value === ' ')) {
        lastChildIndex--
        continue
      }
      break
    }
    
    if (lastChildIndex < 0) {
      node.children.push(cursorNode)
      return true
    }

    const lastChild = node.children[lastChildIndex]

    // If last child is text, append cursor after it in the current node
    if (lastChild.type === 'text') {
      node.children.splice(lastChildIndex + 1, 0, cursorNode)
      return true
    }

    // If last child is a void element, append cursor after it in current node
    if (lastChild.type === 'element' && voidElements.includes(lastChild.tagName)) {
      node.children.splice(lastChildIndex + 1, 0, cursorNode)
      return true
    }

    // Otherwise, go deeper into the last element
    if (lastChild.type === 'element') {
      return injectCursor(lastChild)
    }

    // Fallback: append to current node
    node.children.push(cursorNode)
    return true
  }

  injectCursor(tree)
}

export function MarkdownRenderer({ content, isStreaming }: MarkdownRendererProps) {
  return (
    <div className={`prose max-w-none text-foreground/90 ${isStreaming ? 'streaming-cursor' : ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          rehypeRaw,
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

            // Special case for mermaid diagrams
            const isMermaid = match?.[1] === 'mermaid' || match?.[1] === 'mer' || match?.[1] === 'mmd'
            if (isMermaid) {
              const childrenArray = React.Children.toArray(children)
              const hasCursor = childrenArray.some(
                child => React.isValidElement(child) && (child.props as any)?.['data-cursor']
              )
              return <MermaidDiagram code={content} hasCursor={hasCursor} isStreaming={isStreaming} />
            }

            // Check if this is a block code (has language class or is multi-line)
            const isBlock = match || content.includes('\n')

            if (isBlock) {
              const childrenArray = React.Children.toArray(children)
              const hasCursor = childrenArray.some(
                child => React.isValidElement(child) && (child.props as any)?.['data-cursor']
              )
              return (
                <CodeBlock language={match?.[1]} hasCursor={hasCursor}>{content}</CodeBlock>
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
