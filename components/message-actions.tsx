"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check, RotateCcw, ThumbsUp, ThumbsDown } from "lucide-react"

interface MessageActionsProps {
  messageId: string
  content: string
  modelName?: string
}

export function MessageActions({ messageId, content, modelName = "o3-mini" }: MessageActionsProps) {
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const handleFeedback = (type: "up" | "down") => {
    setFeedback(feedback === type ? null : type)
    console.log(`Feedback for message ${messageId}: ${type}`)
  }

  const handleRegenerate = () => {
    console.log(`Regenerating message ${messageId}`)
    // Implement regeneration logic here
  }

  return (
    <div className="flex items-center space-x-1 text-muted-foreground mt-3">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCopy}
        className="h-8 w-8 hover:bg-accent hover:text-accent-foreground"
      >
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleFeedback("up")}
        className={`h-8 w-8 hover:bg-accent hover:text-accent-foreground ${feedback === "up" ? "text-green-500" : ""}`}
      >
        <ThumbsUp className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleFeedback("down")}
        className={`h-8 w-8 hover:bg-accent hover:text-accent-foreground ${feedback === "down" ? "text-red-500" : ""}`}
      >
        <ThumbsDown className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleRegenerate}
        className="h-8 w-8 hover:bg-accent hover:text-accent-foreground"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>

      <span className="text-sm text-muted-foreground ml-2">{modelName}</span>
    </div>
  )
}
