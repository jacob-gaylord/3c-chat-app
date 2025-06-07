"use client"

import { Button } from "@/components/ui/button"
import { Sun, Settings } from "lucide-react"

interface ChatHeaderProps {
  sidebarOpen: boolean
}

export function ChatHeader({ sidebarOpen }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-slate-600/30 bg-slate-800/50">
      <div className="flex-1"></div>
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" className="hover:bg-slate-700/50">
          <Settings className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="hover:bg-slate-700/50">
          <Sun className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
