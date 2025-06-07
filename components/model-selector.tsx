"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ModelSelectorProps {
  selectedModel: string
  onSelectModel: (model: string) => void
}

const models = [
  {
    id: "o3-mini",
    name: "o3-mini",
    description: "Fast responses, good for simple tasks",
  },
  {
    id: "o3",
    name: "o3",
    description: "Balanced performance and quality",
  },
  {
    id: "o4-mini",
    name: "o4-mini",
    description: "Advanced capabilities, efficient",
  },
  {
    id: "4.1",
    name: "4.1",
    description: "Most powerful, best for complex tasks",
  },
]

export function ModelSelector({ selectedModel, onSelectModel }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)

  const handleSelectModel = (modelId: string) => {
    onSelectModel(modelId)
    setOpen(false)
  }

  const selectedModelData = models.find((model) => model.id === selectedModel) || models[0]

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 py-1.5 text-xs bg-muted/50 border-border hover:bg-accent/50 flex items-center gap-1"
        >
          <span className="text-primary font-medium">{selectedModelData.name}</span>
          <ChevronDown className="h-3 w-3 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {models.map((model) => (
          <DropdownMenuItem
            key={model.id}
            className={`flex flex-col items-start py-2 ${model.id === selectedModel ? "bg-accent/50" : ""}`}
            onClick={() => handleSelectModel(model.id)}
          >
            <span className="font-medium">{model.name}</span>
            <span className="text-xs text-muted-foreground mt-0.5">{model.description}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
