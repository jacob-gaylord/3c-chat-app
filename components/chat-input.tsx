"use client"

import type React from "react"
import { type FormEvent, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Search, Paperclip, ArrowUp, Loader2 } from "lucide-react"
import { ModelSelector } from "@/components/model-selector"

interface ChatInputProps {
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void
  isLoading: boolean
}

export function ChatInput({ input, handleInputChange, handleSubmit, isLoading }: ChatInputProps) {
  const [selectedModel, setSelectedModel] = useState("o3-mini")
  const [searchActive, setSearchActive] = useState(false)

  const toggleSearch = () => {
    setSearchActive(!searchActive)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <Textarea
          value={input}
          onChange={handleInputChange}
          placeholder="Type your message here..."
          className="w-full pr-32 bg-card border-border focus:border-primary resize-none rounded-xl min-h-[44px] flex items-center py-3"
          style={{ lineHeight: "1.5", paddingTop: "10px" }}
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              if (input.trim()) {
                handleSubmit(e as unknown as FormEvent<HTMLFormElement>)
              }
            }
          }}
        />
        <div className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center space-x-2">
          <ModelSelector selectedModel={selectedModel} onSelectModel={setSelectedModel} />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`h-8 w-8 hover:bg-accent/50 ${searchActive ? "text-primary" : ""}`}
            onClick={toggleSearch}
            title="Web search"
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent/50" title="Attach files">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            type="submit"
            size="icon"
            className="h-8 w-8 bg-primary hover:bg-primary/90 rounded-full shadow-lg"
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  )
}
