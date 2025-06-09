import { OpenAI } from '@azure/openai'
import { azureConfig } from '@/lib/config/azure'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

const client = new OpenAI({
  apiKey: azureConfig.AZURE_OPENAI_API_KEY,
  baseURL: `${azureConfig.AZURE_OPENAI_ENDPOINT}/openai/deployments/${azureConfig.AZURE_OPENAI_DEPLOYMENT_NAME}`,
  defaultQuery: { 'api-version': azureConfig.AZURE_OPENAI_API_VERSION },
  defaultHeaders: {
    'api-key': azureConfig.AZURE_OPENAI_API_KEY,
  },
})

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const stream = await client.chat.completions.create({
      model: azureConfig.AZURE_OPENAI_DEPLOYMENT_NAME,
      messages,
      stream: true,
      max_tokens: 2000,
      temperature: 0.7,
    })

    const encoder = new TextEncoder()
    
    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content
              if (content) {
                const data = encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                controller.enqueue(data)
              }
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          } catch (error) {
            console.error('Stream error:', error)
            controller.error(error)
          }
        }
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    )
  } catch (error) {
    console.error("Error in chat API:", error)
    
    if (error instanceof Error && error.message.includes('Invalid Azure OpenAI configuration')) {
      return new Response(JSON.stringify({ error: "Azure OpenAI service is not properly configured" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ error: "Failed to process chat request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}