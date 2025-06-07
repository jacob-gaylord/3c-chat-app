import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    // In a real implementation, this would use Azure OpenAI Service
    // with proper authentication and MCP protocol handling
    const result = streamText({
      model: openai("gpt-4o"),
      messages,
      system: "You are a helpful AI assistant in the T3.chat application, powered by Azure OpenAI Service.",
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Error in chat API:", error)
    return new Response(JSON.stringify({ error: "Failed to process chat request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
