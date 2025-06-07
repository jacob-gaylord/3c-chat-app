"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Search, Pin, PanelLeft, Trash2, PinIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  selectedChatId: string
  onChatSelect: (chatId: string) => void
  onHomeClick: () => void
  onNewChat: () => void
}

export function Sidebar({ isOpen, setIsOpen, selectedChatId, onChatSelect, onHomeClick, onNewChat }: SidebarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [pinnedItems, setPinnedItems] = useState<Set<string>>(
    new Set(["Azure Architecture Guide", "React Best Practices", "Database Design Tips"]),
  )

  const sidebarItems = [
    {
      title: "Pinned",
      items: [
        { id: "azure-guide", name: "Azure Architecture Guide", href: "#", isPinned: true },
        { id: "react-practices", name: "React Best Practices", href: "#", isPinned: true },
        { id: "db-tips", name: "Database Design Tips", href: "#", isPinned: true },
      ],
    },
    {
      title: "Today",
      items: [
        { id: "sample-chat", name: "How does AI work?", href: "#" },
        { id: "microservices", name: "Explain microservices", href: "#" },
      ],
    },
    {
      title: "Yesterday",
      items: [
        { id: "async-await", name: "JavaScript async/await", href: "#" },
        { id: "docker", name: "Docker containerization", href: "#" },
      ],
    },
    {
      title: "Last 7 Days",
      items: [
        { id: "api-patterns", name: "API design patterns", href: "#" },
        { id: "cloud-security", name: "Cloud security basics", href: "#" },
        { id: "git-workflow", name: "Git workflow strategies", href: "#" },
      ],
    },
    {
      title: "Last 30 Days",
      items: [
        { id: "ml-intro", name: "Machine learning intro", href: "#" },
        { id: "devops", name: "DevOps pipeline setup", href: "#" },
      ],
    },
  ]

  const handlePin = (itemName: string) => {
    const newPinned = new Set(pinnedItems)
    if (pinnedItems.has(itemName)) {
      newPinned.delete(itemName)
    } else {
      newPinned.add(itemName)
    }
    setPinnedItems(newPinned)
  }

  const handleDelete = (itemName: string) => {
    console.log(`Deleting: ${itemName}`)
    // Implement delete logic here
  }

  if (!isOpen) return null

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" className="hover:bg-accent" onClick={() => setIsOpen(false)}>
            <PanelLeft className="h-5 w-5" />
          </Button>
          <button
            onClick={onHomeClick}
            className="text-xl font-bold text-primary flex-1 text-center mr-10 hover:text-primary/80 transition-colors cursor-pointer"
          >
            3C Chat
          </button>
        </div>
        <Button onClick={onNewChat} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          New Chat
        </Button>
        <div className="relative mt-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search your threads..."
            className="w-full bg-muted/50 border border-border rounded-md py-2 pl-8 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sidebarItems.map((section) => (
          <div key={section.title} className="mt-4">
            <div className="px-4 py-1 flex items-center text-xs text-muted-foreground font-medium">
              {section.title === "Pinned" && <Pin className="h-3 w-3 mr-1" />}
              {section.title}
            </div>
            <ul>
              {section.items.map((item) => (
                <li
                  key={item.id}
                  className="relative group"
                  onMouseEnter={() => setHoveredItem(item.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <button
                    onClick={() => onChatSelect(item.id)}
                    className={cn(
                      "w-full px-4 py-2 text-sm hover:bg-accent text-left text-foreground hover:text-accent-foreground transition-colors pr-16",
                      selectedChatId === item.id && "bg-accent/40 text-foreground font-medium",
                    )}
                  >
                    {item.name}
                  </button>

                  {/* Hover actions */}
                  {hoveredItem === item.name && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-accent"
                        onClick={(e) => {
                          e.preventDefault()
                          handlePin(item.name)
                        }}
                      >
                        <PinIcon
                          className={cn(
                            "h-3 w-3",
                            pinnedItems.has(item.name) ? "text-primary" : "text-muted-foreground",
                          )}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-destructive/20 hover:text-destructive"
                        onClick={(e) => {
                          e.preventDefault()
                          handleDelete(item.name)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent mr-2 flex items-center justify-center text-primary-foreground text-sm font-medium">
            D
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">Demo User</div>
          </div>
        </div>
      </div>
    </div>
  )
}
