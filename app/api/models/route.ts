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
    const models = data.models || []

    // Fetch details for each model to get context length and capabilities
    const enrichedModels = await Promise.all(
      models.map(async (model: any) => {
        try {
          const detailResponse = await fetch(`${ollamaUrl}/api/show`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
      JSON.stringify({ error: `Cannot connect to Ollama at ${ollamaUrl}: ${message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
