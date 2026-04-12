import { NextRequest } from 'next/server'
import { tools } from '@/lib/tools'

export async function POST(req: NextRequest) {
  try {
    const { toolName, args } = await req.json()
    
    if (typeof (tools as any)[toolName] !== 'function') {
      return new Response(JSON.stringify({ error: `Tool ${toolName} not found` }), { status: 404 })
    }

    const result = await (tools as any)[toolName](args)
    return new Response(JSON.stringify({ result }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
}
