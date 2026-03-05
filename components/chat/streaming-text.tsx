'use client'

import { MarkdownRenderer } from './markdown-renderer'

interface StreamingTextProps {
  content: string
  isStreaming: boolean
}

export function StreamingText({ content, isStreaming }: StreamingTextProps) {
  return <MarkdownRenderer content={content} isStreaming={isStreaming} />
}


