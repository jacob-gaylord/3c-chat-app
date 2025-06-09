"use client"

import { useState, useCallback, useRef } from 'react'
import { Message, ChatError, StreamingState } from '@/lib/types'

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ChatError | null>(null)
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false
  })
  
  // Use ref to track active streams for cleanup
  const abortControllerRef = useRef<AbortController | null>(null)
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)

  const cleanup = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.cancel()
      readerRef.current = null
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setStreamingState({ isStreaming: false })
    setIsLoading(false)
  }, [])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return

    // Clean up any existing streams
    cleanup()

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setError(null)
    
    // Create abort controller for this request
    abortControllerRef.current = new AbortController()
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
        signal: abortControllerRef.current.signal
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      if (!response.body) {
        throw new Error('No response body received')
      }
      
      const reader = response.body.getReader()
      readerRef.current = reader
      const decoder = new TextDecoder()
      
      const assistantMessageId = `assistant-${Date.now()}`
      let assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, assistantMessage])
      setStreamingState({ 
        isStreaming: true, 
        currentMessageId: assistantMessageId 
      })
      
      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) break
          
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              
              if (data === '[DONE]') {
                return
              }
              
              try {
                const parsed = JSON.parse(data)
                if (parsed.content) {
                  assistantMessage.content += parsed.content
                  
                  setMessages(prev => 
                    prev.map(msg => 
                      msg.id === assistantMessageId 
                        ? { ...msg, content: assistantMessage.content }
                        : msg
                    )
                  )
                }
              } catch (parseError) {
                // Skip invalid JSON chunks
                continue
              }
            }
          }
        }
      } finally {
        // Clean up reader
        reader.releaseLock()
        readerRef.current = null
      }
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Request was cancelled, don't show error
        return
      }
      
      console.error('Chat error:', error)
      const chatError: ChatError = {
        message: error.message || 'Failed to send message',
        code: error.code
      }
      setError(chatError)
      
      // Remove the user message if there was an error
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id))
      
    } finally {
      cleanup()
    }
  }, [messages, isLoading, cleanup])

  const clearMessages = useCallback(() => {
    cleanup()
    setMessages([])
    setError(null)
  }, [cleanup])

  const cancelStream = useCallback(() => {
    cleanup()
  }, [cleanup])

  return { 
    messages, 
    sendMessage, 
    isLoading, 
    error, 
    streamingState,
    clearMessages,
    cancelStream
  }
}