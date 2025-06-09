import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { describe, it, expect, vi } from 'vitest'
import ChatInterface from '@/components/chat-interface'
import { ThemeProvider } from '@/components/theme-provider'

// Mock components that might cause issues
vi.mock('@/components/sidebar', () => ({
  Sidebar: ({ onNewChat, onHomeClick }: any) => (
    <div data-testid="sidebar">
      <button onClick={onNewChat} data-testid="new-chat">New Chat</button>
      <button onClick={onHomeClick} data-testid="home">Home</button>
    </div>
  ),
}))

vi.mock('@/components/home-page', () => ({
  HomePage: ({ onNewChat }: any) => (
    <div data-testid="home-page">
      <button onClick={onNewChat} data-testid="start-chat">Start Chat</button>
    </div>
  ),
}))

vi.mock('@/components/settings-modal', () => ({
  SettingsModal: ({ isOpen }: any) => 
    isOpen ? <div data-testid="settings-modal">Settings</div> : null,
}))

vi.mock('@/components/model-selector', () => ({
  ModelSelector: () => <div data-testid="model-selector">Model Selector</div>,
}))

vi.mock('@/components/message-actions', () => ({
  MessageActions: () => <div data-testid="message-actions">Message Actions</div>,
}))

// Mock react-markdown and react-syntax-highlighter
vi.mock('react-markdown', () => {
  return { default: ({ children }: any) => <div data-testid="markdown">{children}</div> }
})

vi.mock('react-syntax-highlighter', () => ({
  Prism: ({ children }: any) => <div data-testid="syntax-highlighter">{children}</div>,
}))

vi.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  oneDark: {},
  oneLight: {},
}))

// Mock the useChat hook
vi.mock('@/hooks/use-chat', () => ({
  useChat: () => ({
    messages: [],
    sendMessage: vi.fn(),
    isLoading: false,
    error: null,
    streamingState: { isStreaming: false, currentMessageId: undefined },
    clearMessages: vi.fn(),
    cancelStream: vi.fn(),
  })
}))

// Mock the useMobile hook
vi.mock('@/hooks/use-mobile', () => ({
  useMobile: () => false
}))

// Mock next-themes properly
vi.mock('next-themes', () => ({
  ThemeProvider: ({ children }: any) => <div data-testid="theme-provider">{children}</div>,
  useTheme: () => ({
    theme: 'dark',
    setTheme: vi.fn(),
  })
}))

const ChatPageComponent = () => {
  const [messages, setMessages] = React.useState<any[]>([])
  
  const handleSendMessage = (content: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content,
    }])
    
    // Mock response for now
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'This is a mock response',
      }])
    }, 100)
  }
  
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <ChatInterface onSendMessage={handleSendMessage} messages={messages} />
    </ThemeProvider>
  )
}

describe('Chat Interface', () => {
  it('should render basic chat interface structure', () => {
    render(<ChatPageComponent />)
    
    // Check that basic elements render
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Type your message here...')).toBeInTheDocument()
  })

  it('should handle basic message flow', async () => {
    const user = userEvent.setup()
    render(<ChatPageComponent />)
    
    // Find the input field
    const input = screen.getByPlaceholderText('Type your message here...')
    expect(input).toBeInTheDocument()
    
    // Type a message
    await user.type(input, 'Hello')
    expect(input).toHaveValue('Hello')
    
    // Find submit button (may be via form submission)
    const form = input.closest('form')
    expect(form).toBeInTheDocument()
    
    // Simulate form submission
    fireEvent.submit(form!)
    
    // Wait for state update
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument()
    })
  })

  it('should show mock responses', async () => {
    const user = userEvent.setup()
    render(<ChatPageComponent />)
    
    const input = screen.getByPlaceholderText('Type your message here...')
    const form = input.closest('form')
    
    await user.type(input, 'Test')
    fireEvent.submit(form!)
    
    // Wait for mock response
    await waitFor(() => {
      expect(screen.getByText('This is a mock response')).toBeInTheDocument()
    }, { timeout: 200 })
  })
})

describe('Chat Interface without external props', () => {
  it('should render with default useChat behavior', () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <ChatInterface />
      </ThemeProvider>
    )
    
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
  })
})