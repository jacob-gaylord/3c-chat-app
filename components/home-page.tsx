"use client"

import { Button } from "@/components/ui/button"
import { MessageSquare, ArrowRight } from "lucide-react"

interface HomePageProps {
  onNewChat: () => void
}

export function HomePage({ onNewChat }: HomePageProps) {
  const quickActions = [
    "How do I optimize SQL query performance?",
    "What are the best practices for React components?",
    "Explain microservices architecture patterns",
    "How to implement Docker containerization?",
    "What's new in TypeScript 5.0?",
    "Guide me through setting up CI/CD pipeline",
  ]

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12">
            <MessageSquare className="h-12 w-12 text-primary mx-auto mb-6" />
            <h1 className="text-3xl md:text-4xl font-bold mb-6">Welcome to 3C Chat</h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Your intelligent AI assistant powered by Azure OpenAI Service.
            </p>
            <Button
              onClick={onNewChat}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
            >
              Start New Conversation
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-medium text-foreground mb-4">Try asking about...</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={onNewChat}
                  className="p-4 text-left rounded-xl hover:bg-accent/50 transition-all duration-200 border border-border hover:border-primary/50 text-foreground"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
