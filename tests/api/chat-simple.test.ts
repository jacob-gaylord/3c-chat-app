import { describe, it, expect, vi, beforeAll } from 'vitest'

// Simple mocks that work reliably
vi.mock('@/lib/config/azure', () => ({
  azureConfig: {
    AZURE_OPENAI_API_KEY: 'test-key-12345',
    AZURE_OPENAI_ENDPOINT: 'https://test.openai.azure.com',
    AZURE_OPENAI_DEPLOYMENT_NAME: 'test-deployment',
    AZURE_OPENAI_API_VERSION: '2024-02-15-preview',
  }
}))

// Mock the Azure client at the module level
vi.mock('@azure/openai', () => {
  const mockCreate = vi.fn()
  return {
    OpenAI: vi.fn(() => ({
      chat: {
        completions: {
          create: mockCreate
        }
      }
    })),
    _mockCreate: mockCreate // Export the mock for use in tests
  }
})

describe('Chat API Basic Tests', () => {
  let POST: any
  let mockCreate: any

  beforeAll(async () => {
    // Import after mocking
    const module = await import('@/app/api/chat/route')
    POST = module.POST
    
    // Get the mock from the module
    const { _mockCreate } = await import('@azure/openai')
    mockCreate = _mockCreate
  })

  it('should return 400 for empty messages array', async () => {
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

  it('should return 400 for missing messages', async () => {
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

  it('should return 400 for non-array messages', async () => {
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

  it('should call Azure OpenAI with correct parameters', async () => {
    // Mock successful stream
    const mockStream = {
      [Symbol.asyncIterator]: async function* () {
        yield { choices: [{ delta: { content: 'Hello' } }] }
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
    
    expect(mockCreate).toHaveBeenCalledWith({
      model: 'test-deployment',
      messages: [{ role: 'user', content: 'Hello' }],
      stream: true,
      max_tokens: 2000,
      temperature: 0.7,
    })
  })
})