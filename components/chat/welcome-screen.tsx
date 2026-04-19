'use client'

import { Sparkles, Code, BookOpen, Lightbulb, MessageSquare } from 'lucide-react'

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void
  hasModels: boolean
}

const suggestions = [
  {
    icon: Code,
    title: 'Write code',
    description: 'Help me build a REST API',
    prompt: 'Help me build a REST API in Python with FastAPI. Include proper error handling, input validation, and a clean project structure.',
  },
  {
    icon: BookOpen,
    title: 'Explain concepts',
    description: 'How do transformers work?',
    prompt: 'Explain how transformer models work in deep learning. Cover attention mechanisms, encoder-decoder architecture, and why they revolutionized NLP.',
  },
  {
    icon: Lightbulb,
    title: 'Brainstorm ideas',
    description: 'Project ideas for learning',
    prompt: 'Suggest 5 creative programming project ideas for an intermediate developer who wants to improve their skills. Include a brief description and tech stack for each.',
  },
  {
    icon: MessageSquare,
    title: 'Creative writing',
    description: 'Write a short story',
    prompt: 'Write a short, engaging science fiction story about an AI that discovers something unexpected about its own consciousness. Keep it under 500 words.',
  },
]

export function WelcomeScreen({ onSuggestionClick, hasModels }: WelcomeScreenProps) {
  return (
    <div className="flex min-h-full w-full flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="flex w-full flex-col items-center text-center my-auto">
        {/* Logo */}
        <div className="mb-4 sm:mb-6 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-primary/10 shadow-lg shadow-primary/5">
          <Sparkles className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
        </div>

        <h1 className="text-balance mb-2 text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
          Welcome to Novexus AI
        </h1>
        <p className="mb-6 sm:mb-8 max-w-md text-pretty text-xs sm:text-sm leading-relaxed text-muted-foreground">
          Your private, local AI assistant powered by Ollama. Fast, secure, and completely on your machine.
        </p>

        {!hasModels && (
          <div className="mb-6 sm:mb-8 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-left w-full max-w-md">
            <p className="text-sm font-medium text-destructive/80">Cannot connect to Ollama</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Make sure Ollama is running on your machine. Start it with{' '}
              <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-foreground">ollama serve</code>
              {' '}or check your connection URL in settings.
            </p>
          </div>
        )}

        {/* Suggestion cards */}
        <div className="grid w-full max-w-xl grid-cols-1 gap-2.5 sm:gap-3 sm:grid-cols-2">
          {suggestions.map((s) => (
            <button
              key={s.title}
              onClick={() => onSuggestionClick(s.prompt)}
              className="group flex flex-col items-start gap-1.5 sm:gap-2 rounded-xl border border-border/50 bg-card/50 p-3 sm:p-4 text-left transition-all duration-200 hover:border-border hover:bg-card hover:shadow-lg hover:shadow-background/30"
            >
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-primary/10 text-primary/70 transition-colors group-hover:bg-primary/15 group-hover:text-primary">
                <s.icon className="h-3.5 w-3.5 sm:h-4 w-4" />
              </div>
              <div>
                <p className="text-[13px] sm:text-sm font-medium text-foreground/80 group-hover:text-foreground">
                  {s.title}
                </p>
                <p className="mt-0.5 text-[11px] sm:text-xs text-muted-foreground/60">
                  {s.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
