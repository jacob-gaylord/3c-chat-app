"use client"

import { useState, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { Sidebar } from "@/components/sidebar"
import { ChatInput } from "@/components/chat-input"
import { ChatMessages } from "@/components/chat-messages"
import { HomePage } from "@/components/home-page"
import { SettingsModal } from "@/components/settings-modal"
import { Button } from "@/components/ui/button"
import { Sun, Moon, Settings, PanelLeft } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import { useTheme } from "next-themes"

export default function ChatInterface() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [currentView, setCurrentView] = useState<"home" | "chat">("chat")
  const [selectedChatId, setSelectedChatId] = useState<string>("sample-chat")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isMobile = useMobile()
  const { theme, setTheme } = useTheme()

  // Sample conversation data
  const sampleMessages = [
    {
      id: "1",
      role: "user" as const,
      content: "How does AI work?",
    },
    {
      id: "2",
      role: "assistant" as const,
      content: `AI, or Artificial Intelligence, is a broad field of computer science that gives computers the ability to perform human-like tasks. It's not one single technology, but rather a collection of techniques and approaches. Here's a simplified breakdown of how it generally works:

**At its core, AI aims to mimic cognitive functions associated with the human mind, such as:**

• **Learning:** Acquiring information and rules for using the information.
• **Reasoning:** Using rules to reach approximate or definite conclusions.
• **Problem-solving:** Finding solutions to complex problems.
• **Perception:** Using sensory input (like sight or hearing) to understand the world.
• **Language understanding:** Comprehending and generating human language.

**Key Components and Approaches:**

1. **Data:** AI systems are heavily reliant on data. They need vast amounts of information to learn from. This data can be text, images, audio, numbers, or any other form of information. The more data an AI system has, the better it can learn and make informed decisions.

2. **Algorithms:** These are sets of rules or instructions that an AI system follows to perform a task. Different AI approaches use different algorithms. Some common types include:

   • **Machine Learning (ML):** This is a subset of AI that focuses on teaching computers to learn from data without being explicitly programmed for every scenario. Instead of writing code for every possible outcome, you feed the machine data and it learns patterns.

   • **Supervised Learning:** The AI learns from labeled data, where the desired output is known. For example, showing it thousands of pictures labeled "cat" or "dog" so it can learn to distinguish between them.`,
    },
    {
      id: "3",
      role: "user" as const,
      content: "Can you explain machine learning in more detail?",
    },
    {
      id: "4",
      role: "assistant" as const,
      content: `**Machine Learning (ML)** is a method of data analysis that automates analytical model building. It's based on the idea that systems can learn from data, identify patterns, and make decisions with minimal human intervention.

**How Machine Learning Works:**

1. **Training Phase:**
   - Feed the algorithm large amounts of data
   - The algorithm identifies patterns and relationships
   - Creates a mathematical model based on these patterns

2. **Testing Phase:**
   - Test the model with new, unseen data
   - Evaluate how well it performs
   - Adjust parameters if needed

3. **Deployment:**
   - Use the trained model to make predictions on new data

**Types of Machine Learning:**

• **Supervised Learning:** Uses labeled training data to learn a mapping from inputs to outputs
• **Unsupervised Learning:** Finds hidden patterns in data without labeled examples
• **Reinforcement Learning:** Learns through interaction with an environment using rewards and penalties

**Common Applications:**
- Image recognition
- Natural language processing
- Recommendation systems
- Fraud detection
- Autonomous vehicles`,
    },
  ]

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: "/api/chat",
    initialMessages: currentView === "chat" ? sampleMessages : [],
  })

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [isMobile])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId)
    setCurrentView("chat")
    if (chatId === "sample-chat") {
      setMessages(sampleMessages)
    } else {
      setMessages([])
    }
  }

  const handleHomeClick = () => {
    setCurrentView("home")
    setSelectedChatId("")
  }

  const handleNewChat = () => {
    setCurrentView("chat")
    setSelectedChatId("")
    setMessages([])
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      {sidebarOpen && (
        <Sidebar
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          selectedChatId={selectedChatId}
          onChatSelect={handleChatSelect}
          onHomeClick={handleHomeClick}
          onNewChat={handleNewChat}
        />
      )}

      <div className="flex flex-col flex-1 h-full overflow-hidden relative">
        {/* Sidebar toggle when collapsed */}
        {!sidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="absolute left-4 top-4 z-20 bg-card/50 hover:bg-accent/50 backdrop-blur-sm border border-border"
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
        )}

        {/* Floating settings buttons */}
        <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-accent/50 bg-card/50 backdrop-blur-sm"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-accent/50 bg-card/50 backdrop-blur-sm"
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>

        {currentView === "home" ? (
          <HomePage onNewChat={handleNewChat} />
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 pt-16 pb-32">
              <ChatMessages messages={messages} messagesEndRef={messagesEndRef} />
            </div>

            {/* Floating chat input */}
            <div className="absolute bottom-6 left-6 right-6 z-10">
              <ChatInput
                input={input}
                handleInputChange={handleInputChange}
                handleSubmit={handleSubmit}
                isLoading={isLoading}
              />
            </div>
          </>
        )}
      </div>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
