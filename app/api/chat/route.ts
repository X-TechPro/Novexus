import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages, model, ollamaUrl, temperature, topP, topK, maxTokens, repeatPenalty, seed, think, numCtx, tools, stream: reqStream } = body
 
    const ollamaEndpoint = `${ollamaUrl || 'http://localhost:11434'}/api/chat`
 
    const response = await fetch(ollamaEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: reqStream ?? true,
        tools,
        think: think ?? false,
        options: {
          temperature: temperature ?? 0.7,
          top_p: topP ?? 0.9,
          top_k: topK ?? 40,
          num_predict: maxTokens ?? 4096,
          num_ctx: numCtx ?? 4096,
          repeat_penalty: repeatPenalty ?? 1.1,
          ...(seed !== null && seed !== undefined ? { seed } : {}),
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return new Response(
        JSON.stringify({ error: `Ollama error: ${response.status} - ${errorText}` }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const reader = response.body?.getReader()
    if (!reader) {
      return new Response(
        JSON.stringify({ error: 'No response stream' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let buffer = ''
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.trim()) {
                controller.enqueue(encoder.encode(line + '\n'))
              }
            }
          }
          if (buffer.trim()) {
            controller.enqueue(encoder.encode(buffer + '\n'))
          }
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: `Failed to connect to Ollama: ${message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
