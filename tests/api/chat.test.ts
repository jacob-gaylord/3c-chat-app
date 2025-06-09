import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Create mock functions at module level
const mockCreate = vi.fn()

// Mock the Azure OpenAI client
vi.mock('@azure/openai', () => ({
  OpenAI: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate
      }
    }
  }))
}))

// Mock the azure config
vi.mock('@/lib/config/azure', () => ({
  azureConfig: {
    AZURE_OPENAI_API_KEY: 'test-key-12345',
    AZURE_OPENAI_ENDPOINT: 'https://test.openai.azure.com',
    AZURE_OPENAI_DEPLOYMENT_NAME: 'test-deployment',
    AZURE_OPENAI_API_VERSION: '2024-02-15-preview',
  }
}))

import { POST } from '@/app/api/chat/route'

describe('Chat API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should stream responses from Azure OpenAI', async () => {
    const mockStream = {
      [Symbol.asyncIterator]: async function* () {
        yield {
          choices: [{ delta: { content: 'Hello' } }]
        }
        yield {
          choices: [{ delta: { content: ' world' } }]
        }
        yield {
          choices: [{ delta: { content: '!' } }]
        }
      }
    }

    mockCreate.mockResolvedValue(mockStream)

    const request = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }]
      })
    })

    const response = await POST(request)

    expect(response.ok).toBe(true)
    expect(response.headers.get('content-type')).toBe('text/event-stream')
    expect(response.headers.get('cache-control')).toBe('no-cache')
    expect(response.headers.get('connection')).toBe('keep-alive')

    expect(mockCreate).toHaveBeenCalledWith({
      model: 'test-deployment',
      messages: [{ role: 'user', content: 'Hello' }],
      stream: true,
      max_tokens: 2000,
      temperature: 0.7,
    })
  })

  it('should handle empty messages array', async () => {
    const request = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [] })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Messages array is required')
  })

  it('should handle missing messages', async () => {
    const request = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Messages array is required')
  })

  it('should handle non-array messages', async () => {
    const request = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: 'invalid' })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Messages array is required')
  })

  it('should handle Azure OpenAI API errors', async () => {
    mockCreate.mockRejectedValue(new Error('API rate limit exceeded'))

    const request = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }]
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to process chat request')
  })

  it('should handle Azure configuration errors', async () => {
    mockCreate.mockRejectedValue(new Error('Invalid Azure OpenAI configuration'))

    const request = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }]
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to process chat request')
  })

  it('should handle JSON parsing errors', async () => {
    const request = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to process chat request')
  })

  it('should handle streaming errors gracefully', async () => {
    const mockStream = {
      [Symbol.asyncIterator]: async function* () {
        yield {
          choices: [{ delta: { content: 'Hello' } }]
        }
        throw new Error('Stream interrupted')
      }
    }

    mockCreate.mockResolvedValue(mockStream)

    const request = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }]
      })
    })

    const response = await POST(request)

    expect(response.ok).toBe(true)
    expect(response.headers.get('content-type')).toBe('text/event-stream')
  })

  it('should properly encode stream data', async () => {
    const mockStream = {
      [Symbol.asyncIterator]: async function* () {
        yield {
          choices: [{ delta: { content: 'Test content' } }]
        }
      }
    }

    mockCreate.mockResolvedValue(mockStream)

    const request = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }]
      })
    })

    const response = await POST(request)
    
    expect(response.ok).toBe(true)
    
    // Verify the stream contains properly formatted data
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    
    if (reader) {
      const { value } = await reader.read()
      const chunk = decoder.decode(value)
      expect(chunk).toContain('data: {"content":"Test content"}')
    }
  })
})