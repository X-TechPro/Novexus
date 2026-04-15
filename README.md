# Novexus

A premium AI chat interface for your local [Ollama](https://ollama.com/) models. Built with Next.js, TypeScript, and shadcn/ui, Novexus provides a polished, feature-rich experience for running AI models entirely on your own device.

## Features

- **Local AI Integration** — Connects to Ollama running locally on your device for private, offline AI conversations
- **Tool Use** — AI assistant can use built-in tools to perform real-world actions:
  - `calculate` — Evaluate mathematical expressions
  - `clock` — Get the current date and time
  - `memories` — Read/write persistent memories across sessions
  - `files` — Read, write, append, and list files in your workspace
  - `run_command` — Execute shell commands
  - `search` — Search the web via DuckDuckGo (powered by Puppeteer)
  - `open_page` — Open and extract content from any website URL
- **Conversation Management** — Create, rename, delete, and switch between multiple conversations
- **Streaming Responses** — Real-time streaming output with optional thinking/reasoning visibility
- **Model Selection** — Choose from available Ollama models on the fly
- **Markdown Rendering** — Full Markdown support with syntax highlighting (highlight.js), KaTeX math rendering, and GFM tables
- **Customizable Settings** — Configure temperature, top-p, top-k, max tokens, context length, repeat penalty, and system prompts
- **Dark Theme** — Beautiful dark UI with Inter & JetBrains Mono fonts
- **Persistent Storage** — Conversations and settings saved to localStorage
- **Responsive Design** — Built with Tailwind CSS v4 and shadcn/ui components

## Tech Stack

- **Framework:** Next.js 16 (App Router, RSC)
- **Language:** TypeScript
- **UI:** React 19, shadcn/ui (New York style), Radix UI primitives
- **Styling:** Tailwind CSS v4, custom dark theme with oklch colors
- **State:** SWR for data fetching, localStorage for persistence
- **Tools Runtime:** Puppeteer (headless browser), JSDOM, Turndown (HTML→Markdown)
- **Markdown:** react-markdown with rehype/remark plugins
- **Forms:** react-hook-form with Zod validation
- **Fonts:** Inter (sans-serif), JetBrains Mono (monospace)

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ and pnpm/npm
- [Ollama](https://ollama.com/) installed and running locally on `http://localhost:11434`
- At least one Ollama model pulled (e.g., `ollama pull qwen3.5`)

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Novexus
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Start Ollama** (if not already running)
   ```bash
   ollama serve
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command        | Description                          |
| -------------- | ------------------------------------ |
| `npm run dev`  | Start the Next.js development server |
| `npm run build`| Build the production bundle          |
| `npm run start`| Start the production server          |
| `npm run lint` | Run ESLint                           |

## Project Structure

```
Novexus/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── chat/             # Chat streaming endpoint
│   │   ├── execute-tool/     # Tool execution endpoint
│   │   └── models/           # Ollama models listing
│   ├── globals.css           # Global styles & theme vars
│   ├── layout.tsx            # Root layout with fonts
│   └── page.tsx              # Main chat page
├── components/
│   ├── chat/                 # Chat UI components
│   │   ├── chat-sidebar.tsx
│   │   ├── chat-header.tsx
│   │   ├── chat-area.tsx
│   │   ├── chat-input.tsx
│   │   ├── settings-dialog.tsx
│   │   └── ...
│   ├── ui/                   # shadcn/ui components
│   └── theme-provider.tsx
├── hooks/
│   ├── use-chat-engine.ts    # Core chat engine hook
│   ├── use-mobile.ts
│   └── use-toast.ts
├── lib/
│   ├── chat-store.ts         # localStorage persistence
│   ├── tool-definitions.ts   # Tool schemas for Ollama
│   ├── tools.ts              # Server-side tool implementations
│   ├── types.ts              # TypeScript type definitions
│   └── utils.ts              # Utility functions
└── memories.json             # Persistent memory store (auto-created)
```

## Configuration

### Settings (via Settings Dialog)

| Setting          | Default                     | Description                         |
| ---------------- | --------------------------- | ----------------------------------- |
| Ollama URL       | `http://localhost:11434`    | URL of your Ollama instance         |
| Temperature      | `0.7`                       | Sampling temperature                |
| Top P            | `0.9`                       | Nucleus sampling threshold          |
| Top K            | `40`                        | Top-k sampling value               |
| Max Tokens       | `4096`                      | Maximum output tokens               |
| Max Context      | `0` (unlimited)             | Maximum context window size         |
| Repeat Penalty   | `1.1`                       | Repetition penalty factor           |
| Seed             | `null` (random)             | Fixed random seed for reproducibility|

### System Prompt

The default system prompt can be customized via the Settings Dialog. The AI is configured as "Novexus" — a Gen Z-style assistant that runs locally on your device.

