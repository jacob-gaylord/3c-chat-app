"use client"

import type React from "react"
import { useEffect, useState } from "react"
import type { Message } from "@/lib/types"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism"
import { MessageActions } from "@/components/message-actions"
import { useTheme } from "next-themes"

interface ChatMessagesProps {
  messages: Message[]
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  isStreaming?: boolean
  currentStreamingId?: string
}

export function ChatMessages({ messages, messagesEndRef, isStreaming, currentStreamingId }: ChatMessagesProps) {
  const [hasMessages, setHasMessages] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    setHasMessages(messages.length > 0)
  }, [messages])

  const sampleQuestions = [
    "How do I optimize SQL query performance?",
    "What are the best practices for React components?",
    "Explain microservices architecture patterns",
    "How to implement Docker containerization?",
  ]

  return (
    <div className="flex flex-col min-h-full">
      {!hasMessages ? (
        <div className="flex flex-col items-center justify-center flex-1">
          <div className="max-w-2xl w-full text-center">
            <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              How can I help you today?
            </h1>
            <div className="grid grid-cols-1 gap-3">
              {sampleQuestions.map((question, index) => (
                <button
                  key={index}
                  className="p-4 text-left rounded-xl hover:bg-accent/50 transition-all duration-200 border border-border hover:border-primary/50 text-foreground"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-4xl mx-auto space-y-8">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] ${message.role === "user" ? "max-w-[70%]" : ""}`}>
                {message.role === "user" ? (
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md p-3 shadow-lg">
                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="prose prose-sm max-w-none text-sm leading-relaxed text-foreground">
                      <ReactMarkdown
                        components={{
                          code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || "")
                            const codeContent = String(children).replace(/\n$/, "")

                            return !inline && match ? (
                              <div className="relative group my-4">
                                <div className="bg-muted/50 rounded-t-lg px-3 py-2 border-b border-border">
                                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    {match[1]}
                                  </span>
                                </div>
                                <SyntaxHighlighter
                                  style={theme === "dark" ? oneDark : oneLight}
                                  language={match[1]}
                                  PreTag="div"
                                  className="!mt-0 !rounded-t-none rounded-b-lg text-xs !bg-muted/30"
                                  customStyle={{
                                    margin: 0,
                                    borderTopLeftRadius: 0,
                                    borderTopRightRadius: 0,
                                  }}
                                  {...props}
                                >
                                  {codeContent}
                                </SyntaxHighlighter>
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={async () => {
                                      try {
                                        await navigator.clipboard.writeText(codeContent)
                                      } catch (err) {
                                        console.error("Failed to copy code: ", err)
                                      }
                                    }}
                                    className="h-8 w-8 bg-card/80 hover:bg-accent rounded p-1.5 transition-colors border border-border"
                                  >
                                    <svg
                                      className="h-4 w-4 text-foreground"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <code
                                className="bg-muted/70 px-1.5 py-0.5 rounded text-xs text-foreground font-mono border border-border/50"
                                {...props}
                              >
                                {children}
                              </code>
                            )
                          },
                          h1: ({ children }) => (
                            <h1 className="text-lg font-bold text-foreground mb-4 mt-6 first:mt-0 pb-2 border-b border-border">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-base font-semibold text-foreground mb-3 mt-5 pb-1 border-b border-border/50">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-sm font-medium text-foreground mb-2 mt-4 font-semibold">{children}</h3>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-none space-y-1 text-foreground ml-0 text-sm my-3">{children}</ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal space-y-1 text-foreground pl-5 text-sm my-3">{children}</ol>
                          ),
                          p: ({ children }) => (
                            <p className="text-foreground mb-3 leading-relaxed text-sm first:mt-0">{children}</p>
                          ),
                          strong: ({ children }) => (
                            <strong className="text-foreground font-semibold">{children}</strong>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-primary bg-muted/30 pl-4 py-2 italic text-foreground my-4 text-sm rounded-r-md">
                              {children}
                            </blockquote>
                          ),
                          li: ({ children, ...props }) => {
                            // Check if this is a bullet point (starts with •)
                            const content = String(children)
                            if (content.startsWith("•")) {
                              return (
                                <li className="mb-1 text-sm text-foreground flex items-start" {...props}>
                                  <span className="text-primary mr-2 mt-0.5 font-bold">•</span>
                                  <span>{content.substring(1).trim()}</span>
                                </li>
                              )
                            }
                            return (
                              <li className="mb-1 text-sm text-foreground" {...props}>
                                {children}
                              </li>
                            )
                          },
                          table: ({ children }) => (
                            <div className="overflow-x-auto my-4">
                              <table className="min-w-full border border-border rounded-lg">{children}</table>
                            </div>
                          ),
                          thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
                          th: ({ children }) => (
                            <th className="px-3 py-2 text-left text-xs font-medium text-foreground border-b border-border">
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className="px-3 py-2 text-sm text-foreground border-b border-border/50">{children}</td>
                          ),
                          hr: () => <hr className="my-6 border-border" />,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                      {isStreaming && currentStreamingId === message.id && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <div className="flex space-x-1">
                            <div className="w-1 h-1 bg-primary rounded-full animate-bounce"></div>
                            <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span>Generating...</span>
                        </div>
                      )}
                    </div>
                    <MessageActions messageId={message.id} content={message.content} modelName="o3-mini" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  )
}
