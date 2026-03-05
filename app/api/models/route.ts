import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const ollamaUrl = req.nextUrl.searchParams.get('url') || 'http://localhost:11434'

  try {
    const response = await fetch(`${ollamaUrl}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch models: ${response.status}` }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: `Cannot connect to Ollama at ${ollamaUrl}: ${message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
