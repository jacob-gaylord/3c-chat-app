import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { vi } from 'vitest'
import { ThemeProvider } from '@/components/theme-provider'
import type { Message } from '@/lib/types'

// Mock providers wrapper
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      {children}
    </ThemeProvider>
  )
}

// Custom render function that includes providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Test fixtures
export const mockMessages: Message[] = [
  {
    id: '1',
    role: 'user',
    content: 'Hello, how are you?',
    timestamp: new Date('2024-01-01T10:00:00Z'),
  },
  {
    id: '2',
    role: 'assistant',
    content: 'I am doing well, thank you for asking! How can I help you today?',
    timestamp: new Date('2024-01-01T10:00:30Z'),
  },
  {
    id: '3',
    role: 'user',
    content: 'Can you explain machine learning?',
    timestamp: new Date('2024-01-01T10:01:00Z'),
  },
]

export const mockStreamingMessage: Message = {
  id: '4',
  role: 'assistant',
  content: 'Machine learning is a subset of artificial intelligence...',
  timestamp: new Date('2024-01-01T10:01:30Z'),
}

// Mock API responses
export const mockChatResponse = {
  ok: true,
  status: 200,
  headers: new Headers({
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache',
    'connection': 'keep-alive',
  }),
  body: new ReadableStream({
    start(controller) {
      const chunks = [
        'data: {"content":"Hello"}\n\n',
        'data: {"content":" there"}\n\n',
        'data: {"content":"!"}\n\n',
        'data: [DONE]\n\n',
      ]
      
      chunks.forEach((chunk, index) => {
        setTimeout(() => {
          controller.enqueue(new TextEncoder().encode(chunk))
          if (index === chunks.length - 1) {
            controller.close()
          }
        }, index * 10)
      })
    }
  })
}

export const mockErrorResponse = {
  ok: false,
  status: 500,
  json: async () => ({ error: 'Internal server error' })
}

// Mock implementations for common hooks
export const mockUseChatHook = {
  messages: mockMessages,
  sendMessage: vi.fn(),
  isLoading: false,
  error: null,
  streamingState: { isStreaming: false, currentMessageId: undefined },
  clearMessages: vi.fn(),
  cancelStream: vi.fn(),
}

export const mockUseChatHookLoading = {
  ...mockUseChatHook,
  isLoading: true,
  streamingState: { isStreaming: true, currentMessageId: '4' },
}

export const mockUseChatHookError = {
  ...mockUseChatHook,
  error: { message: 'Failed to send message', code: 'NETWORK_ERROR' },
}

// Helper functions for testing
export const createMockRequest = (body: any, options: RequestInit = {}) => {
  return new Request('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    ...options,
  })
}

export const createMockFormEvent = (formData: Record<string, string>) => {
  const form = document.createElement('form')
  Object.entries(formData).forEach(([key, value]) => {
    const input = document.createElement('input')
    input.name = key
    input.value = value
    form.appendChild(input)
  })
  
  return {
    preventDefault: vi.fn(),
    currentTarget: form,
    target: form,
  } as unknown as React.FormEvent<HTMLFormElement>
}

export const waitForStreamingComplete = (timeout = 1000) => {
  return new Promise(resolve => setTimeout(resolve, timeout))
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'
export { customRender as render } 