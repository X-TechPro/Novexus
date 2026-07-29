import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      provider = 'ollama',
      messages,
      model,
      ollamaUrl,
      ollamaApiKey,
      llamaCppUrl,
      llamaCppApiKey,
      temperature,
      topP,
      topK,
      maxTokens,
      repeatPenalty,
      seed,
      think,
      numCtx,
      tools,
      stream: reqStream,
    } = body

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    if (provider === 'llama-cpp') {
      const endpoint = `${llamaCppUrl || 'http://0.0.0.0:8080'}/v1/chat/completions`
      const apiKey = llamaCppApiKey ?? '123'

      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`
      }

      const formattedMessages = messages.map((m: any) => ({
        role: m.role,
        content: m.content,
        ...(m.tool_calls ? { tool_calls: m.tool_calls } : {}),
        ...(m.tool_name ? { name: m.tool_name } : {}),
      }))

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: model || 'llama-cpp',
          messages: formattedMessages,
          stream: reqStream ?? true,
          temperature: temperature ?? 0.7,
          top_p: topP ?? 0.9,
          top_k: topK ?? 40,
          max_tokens: maxTokens ?? 4096,
          repeat_penalty: repeatPenalty ?? 1.1,
          ...(seed !== null && seed !== undefined ? { seed } : {}),
          ...(tools ? { tools } : {}),
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return new Response(
          JSON.stringify({ error: `Llama.cpp error: ${response.status} - ${errorText}` }),
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

      const stream = new ReadableStream({
        async start(controller) {
          try {
            let buffer = ''
            let lastEvalCount = 0
            let lastEvalDuration = 0
            let lastTokensPerSecond = 0

            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              buffer += decoder.decode(value, { stream: true })
              const lines = buffer.split('\n')
              buffer = lines.pop() || ''

              for (const rawLine of lines) {
                const line = rawLine.trim()
                if (!line || line.startsWith(':')) continue

                if (line.startsWith('data: ')) {
                  const dataStr = line.slice(6).trim()
                  if (dataStr === '[DONE]') {
                    controller.enqueue(
                      encoder.encode(
                        JSON.stringify({
                          done: true,
                          eval_count: lastEvalCount,
                          eval_duration: lastEvalDuration,
                          tokens_per_second: lastTokensPerSecond,
                        }) + '\n'
                      )
                    )
                    continue
                  }

                  try {
                    const parsed = JSON.parse(dataStr)
                    const choice = parsed.choices?.[0]
                    const delta = choice?.delta

                    if (parsed.timings) {
                      if (typeof parsed.timings.predicted_n === 'number') lastEvalCount = parsed.timings.predicted_n
                      if (typeof parsed.timings.predicted_ms === 'number') lastEvalDuration = parsed.timings.predicted_ms
                      if (typeof parsed.timings.predicted_per_second === 'number') lastTokensPerSecond = parsed.timings.predicted_per_second
                    }
                    if (parsed.usage?.completion_tokens) {
                      lastEvalCount = parsed.usage.completion_tokens
                    }

                    if (delta) {
                      const messageObj: any = {}
                      if (delta.content !== undefined && delta.content !== null) {
                        messageObj.content = delta.content
                      }
                      if (delta.reasoning_content || delta.thinking) {
                        messageObj.thinking = delta.reasoning_content || delta.thinking
                      }
                      if (delta.tool_calls) {
                        messageObj.tool_calls = delta.tool_calls
                      }

                      if (Object.keys(messageObj).length > 0) {
                        controller.enqueue(
                          encoder.encode(
                            JSON.stringify({
                              message: messageObj,
                              done: choice?.finish_reason ? true : false,
                              eval_count: lastEvalCount || undefined,
                              tokens_per_second: lastTokensPerSecond || undefined,
                            }) + '\n'
                          )
                        )
                      }
                    }
                  } catch {
                    // Ignore SSE json parse error
                  }
                }
              }
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
    }

    // Default: Ollama provider
    const ollamaEndpoint = `${ollamaUrl || 'http://localhost:11434'}/api/chat`

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (ollamaApiKey) {
      headers['Authorization'] = `Bearer ${ollamaApiKey}`
    }

    const response = await fetch(ollamaEndpoint, {
      method: 'POST',
      headers,
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
      JSON.stringify({ error: `Failed to connect to AI server: ${message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
