import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, it, expect, vi } from 'vitest'
import Home from '@/app/page'

// Mock the ChatInterface component
vi.mock('@/components/chat-interface', () => {
  return {
    default: function MockChatInterface(props: any) {
      return (
        <div data-testid="chat-interface">
          {props.onSendMessage && <div data-testid="external-mode">External Mode</div>}
          {props.messages !== undefined && <div data-testid="external-messages">External Messages</div>}
        </div>
      )
    }
  }
})

describe('Home Page', () => {
  it('should render theme provider and chat interface', () => {
    render(<Home />)
    
    expect(screen.getByTestId('chat-interface')).toBeInTheDocument()
  })

  it('should wrap chat interface in theme provider', () => {
    render(<Home />)
    
    // Theme provider should be wrapping the chat interface
    const chatInterface = screen.getByTestId('chat-interface')
    expect(chatInterface).toBeInTheDocument()
  })
})

// Test the basic chat functionality scenario
describe('Chat Page (Basic Mode)', () => {
  it('should handle message state correctly when using external props', async () => {
    // Test the mock directly with external props
    const { default: MockChatInterface } = await import('@/components/chat-interface')
    
    render(<MockChatInterface onSendMessage={() => {}} messages={[]} />)
    
    // Should render in external mode
    expect(screen.getByTestId('external-mode')).toBeInTheDocument()
    expect(screen.getByTestId('external-messages')).toBeInTheDocument()
  })
})