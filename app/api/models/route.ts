import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get('provider') || 'ollama'
  const defaultUrl = provider === 'llama-cpp' ? 'http://0.0.0.0:8080' : 'http://localhost:11434'
  const targetUrl = req.nextUrl.searchParams.get('url') || defaultUrl
  const apiKey = req.nextUrl.searchParams.get('key') || ''

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`
  }

  if (provider === 'llama-cpp') {
    try {
      // First try OpenAI compatible /v1/models endpoint
      let response = await fetch(`${targetUrl}/v1/models`, {
        method: 'GET',
        headers,
      })

      if (response.ok) {
        const data = await response.json()
        const rawModels = data.data || data.models || []
        const models = rawModels.map((m: any) => ({
          name: m.id || m.name || 'llama-cpp',
          size: m.size || 0,
          digest: '',
          modified_at: new Date().toISOString(),
          contextLength: 8192,
          capabilities: ['tools', 'thinking'],
        }))

        if (models.length > 0) {
          return new Response(JSON.stringify({ models }), {
            headers: { 'Content-Type': 'application/json' },
          })
        }
      }

      // Fallback: Try /props endpoint on llama-server
      const propsResponse = await fetch(`${targetUrl}/props`, {
        method: 'GET',
        headers,
      })

      if (propsResponse.ok) {
        const propsData = await propsResponse.json()
        const defaultModelName = propsData.default_generation_settings?.model || 'llama-cpp'
        return new Response(
          JSON.stringify({
            models: [
              {
                name: defaultModelName,
                size: 0,
                digest: '',
                modified_at: new Date().toISOString(),
                contextLength: propsData.default_generation_settings?.n_ctx || 8192,
                capabilities: ['tools', 'thinking'],
              },
            ],
          }),
          { headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Default single loaded model fallback if llama-server is responsive
      return new Response(
        JSON.stringify({
          models: [
            {
              name: 'llama-cpp',
              size: 0,
              digest: '',
              modified_at: new Date().toISOString(),
              contextLength: 8192,
              capabilities: ['tools', 'thinking'],
            },
          ],
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return new Response(
        JSON.stringify({ error: `Cannot connect to Llama.cpp server at ${targetUrl}: ${message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  // Default: Ollama provider
  try {
    const response = await fetch(`${targetUrl}/api/tags`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch models: ${response.status}` }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    const models = data.models || []

    // Fetch details for each model to get context length and capabilities
    const enrichedModels = await Promise.all(
      models.map(async (model: any) => {
        try {
          const detailResponse = await fetch(`${targetUrl}/api/show`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ name: model.name }),
          })

          if (detailResponse.ok) {
            const detailData = await detailResponse.json()
            
            // Extract context length
            let contextLength = 4096
            if (detailData.model_info) {
              for (const [key, value] of Object.entries(detailData.model_info)) {
                if (key.endsWith('.context_length') && typeof value === 'number') {
                  contextLength = value
                  break
                }
              }
            }

            const capabilities = detailData.capabilities || []
            
            // Check for vision via projector
            if (detailData.projector_info && !capabilities.includes('vision')) {
              capabilities.push('vision')
            }

            // Check for tools via template
            const template = detailData.template || ''
            if ((template.includes('tool_call') || template.includes('tool_code') || template.includes('tools')) && !capabilities.includes('tools')) {
              capabilities.push('tools')
            }
            
            // Llama 3.1+ support tools even if not in template explicitly sometimes
            if (model.name.includes('llama3.1') || model.name.includes('llama3.2') || model.name.includes('qwen') || model.name.includes('mistral')) {
              if (!capabilities.includes('tools')) capabilities.push('tools')
            }

            return {
              ...model,
              contextLength,
              capabilities,
            }
          }
        } catch (e) {
          console.error(`Failed to fetch details for ${model.name}:`, e)
        }
        return { ...model, contextLength: 4096, capabilities: [] }
      })
    )

    return new Response(JSON.stringify({ models: enrichedModels }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: `Cannot connect to Ollama at ${targetUrl}: ${message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
