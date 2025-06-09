import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useChat } from '@/hooks/use-chat'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock ReadableStream and related APIs
class MockReadableStreamDefaultReader {
  private chunks: Uint8Array[]
  private index = 0

  constructor(chunks: Uint8Array[]) {
    this.chunks = chunks
  }

  async read() {
    if (this.index >= this.chunks.length) {
      return { done: true, value: undefined }
    }
    const value = this.chunks[this.index++]
    return { done: false, value }
  }

  releaseLock() {
    // Mock implementation
  }

  cancel() {
    return Promise.resolve()
  }
}

class MockReadableStream {
  constructor(private chunks: Uint8Array[]) {}

  getReader() {
    return new MockReadableStreamDefaultReader(this.chunks)
  }
}

describe('useChat Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useChat())

    expect(result.current.messages).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
    expect(result.current.streamingState.isStreaming).toBe(false)
  })

  it('should send a message and handle streaming response', async () => {
    const encoder = new TextEncoder()
    const mockChunks = [
      encoder.encode('data: {"content":"Hello"}\n\n'),
      encoder.encode('data: {"content":" world"}\n\n'),
      encoder.encode('data: [DONE]\n\n')
    ]

    const mockResponse = {
      ok: true,
      body: new MockReadableStream(mockChunks)
    }

    mockFetch.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useChat())

    await act(async () => {
      await result.current.sendMessage('Test message')
    })

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2)
    })

    // Check user message
    expect(result.current.messages[0].role).toBe('user')
    expect(result.current.messages[0].content).toBe('Test message')

    // Check assistant message
    expect(result.current.messages[1].role).toBe('assistant')
    expect(result.current.messages[1].content).toBe('Hello world')

    expect(result.current.isLoading).toBe(false)
    expect(result.current.streamingState.isStreaming).toBe(false)
  })

  it('should handle API errors', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: vi.fn().mockResolvedValue({ error: 'Server error' })
    }

    mockFetch.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useChat())

    await act(async () => {
      await result.current.sendMessage('Test message')
    })

    expect(result.current.error).toEqual({
      message: 'Server error',
      code: undefined
    })

    // Should not add messages on error
    expect(result.current.messages).toHaveLength(0)
  })

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useChat())

    await act(async () => {
      await result.current.sendMessage('Test message')
    })

    expect(result.current.error).toEqual({
      message: 'Network error',
      code: undefined
    })
  })

  it('should not send empty messages', async () => {
    const { result } = renderHook(() => useChat())

    await act(async () => {
      await result.current.sendMessage('   ')
    })

    expect(mockFetch).not.toHaveBeenCalled()
    expect(result.current.messages).toHaveLength(0)
  })

  it('should not send messages while loading', async () => {
    const encoder = new TextEncoder()
    const mockChunks = [
      encoder.encode('data: {"content":"Response"}\n\n'),
      encoder.encode('data: [DONE]\n\n')
    ]

    const mockResponse = {
      ok: true,
      body: new MockReadableStream(mockChunks)
    }

    mockFetch.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useChat())

    // Start first message and don't await it immediately
    act(() => {
      result.current.sendMessage('First message')
    })

    // Verify first call is loading
    expect(result.current.isLoading).toBe(true)

    // Try to send second message while first is loading
    act(() => {
      result.current.sendMessage('Second message')
    })

    // Wait for the first message to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Should only have sent one request
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('should clear messages', () => {
    const { result } = renderHook(() => useChat())

    // Add some messages first
    act(() => {
      result.current.sendMessage('Test')
    })

    act(() => {
      result.current.clearMessages()
    })

    expect(result.current.messages).toHaveLength(0)
    expect(result.current.error).toBe(null)
  })

  it('should handle abort signals', async () => {
    const abortError = new Error('Request cancelled')
    abortError.name = 'AbortError'
    
    mockFetch.mockRejectedValue(abortError)

    const { result } = renderHook(() => useChat())

    await act(async () => {
      await result.current.sendMessage('Test message')
    })

    // Should not set error for abort
    expect(result.current.error).toBe(null)
  })

  it('should cancel streaming', async () => {
    const encoder = new TextEncoder()
    const mockChunks = [
      encoder.encode('data: {"content":"Hello"}\n\n'),
    ]

    const mockResponse = {
      ok: true,
      body: new MockReadableStream(mockChunks)
    }

    mockFetch.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useChat())

    // Start streaming
    act(() => {
      result.current.sendMessage('Test message')
    })

    // Cancel immediately
    act(() => {
      result.current.cancelStream()
    })

    expect(result.current.streamingState.isStreaming).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })

  it('should include message history in API calls', async () => {
    const encoder = new TextEncoder()
    const mockChunks = [
      encoder.encode('data: {"content":"Response"}\n\n'),
      encoder.encode('data: [DONE]\n\n')
    ]

    const mockResponse = {
      ok: true,
      body: new MockReadableStream(mockChunks)
    }

    mockFetch.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useChat())

    // Send first message
    await act(async () => {
      await result.current.sendMessage('First message')
    })

    // Send second message
    await act(async () => {
      await result.current.sendMessage('Second message')
    })

    // Check that the second call included message history
    const secondCall = mockFetch.mock.calls[1][1]
    const requestBody = JSON.parse(secondCall.body)
    
    expect(requestBody.messages).toHaveLength(3) // first user + first assistant + second user
    expect(requestBody.messages[0].content).toBe('First message')
    expect(requestBody.messages[1].content).toBe('Response')
    expect(requestBody.messages[2].content).toBe('Second message')
  })
})