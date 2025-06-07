"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { X, Plus, Trash2, Upload, File, FileText, ImageIcon } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface MCPServer {
  id: string
  name: string
  command: string
  args: string[]
  enabled: boolean
}

interface UploadedFile {
  id: string
  name: string
  size: string
  type: string
  date: string
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [systemPrompt, setSystemPrompt] = useState("")
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([
    {
      id: "1",
      name: "File System",
      command: "npx",
      args: ["@modelcontextprotocol/server-filesystem", "/path/to/allowed/files"],
      enabled: true,
    },
    {
      id: "2",
      name: "Git",
      command: "npx",
      args: ["@modelcontextprotocol/server-git", "--repository", "/path/to/repo"],
      enabled: false,
    },
  ])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([
    {
      id: "1",
      name: "project-requirements.pdf",
      size: "2.4 MB",
      type: "pdf",
      date: "2023-06-15",
    },
    {
      id: "2",
      name: "data-analysis.xlsx",
      size: "1.8 MB",
      type: "excel",
      date: "2023-06-14",
    },
    {
      id: "3",
      name: "architecture-diagram.png",
      size: "3.2 MB",
      type: "image",
      date: "2023-06-10",
    },
    {
      id: "4",
      name: "api-documentation.md",
      size: "0.5 MB",
      type: "markdown",
      date: "2023-06-08",
    },
  ])

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSystemPrompt = localStorage.getItem("systemPrompt")
    const savedMcpServers = localStorage.getItem("mcpServers")

    if (savedSystemPrompt) {
      setSystemPrompt(savedSystemPrompt)
    }
    if (savedMcpServers) {
      setMcpServers(JSON.parse(savedMcpServers))
    }
  }, [])

  const saveSettings = () => {
    localStorage.setItem("systemPrompt", systemPrompt)
    localStorage.setItem("mcpServers", JSON.stringify(mcpServers))
    onClose()
  }

  const addMcpServer = () => {
    const newServer: MCPServer = {
      id: Date.now().toString(),
      name: "New Server",
      command: "",
      args: [],
      enabled: false,
    }
    setMcpServers([...mcpServers, newServer])
  }

  const updateMcpServer = (id: string, updates: Partial<MCPServer>) => {
    setMcpServers((servers) => servers.map((server) => (server.id === id ? { ...server, ...updates } : server)))
  }

  const deleteMcpServer = (id: string) => {
    setMcpServers((servers) => servers.filter((server) => server.id !== id))
  }

  const updateServerArgs = (id: string, argsString: string) => {
    const args = argsString.split(" ").filter((arg) => arg.trim() !== "")
    updateMcpServer(id, { args })
  }

  const deleteFile = (id: string) => {
    setUploadedFiles((files) => files.filter((file) => file.id !== id))
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-4 w-4 text-blue-400" />
      case "pdf":
        return <FileText className="h-4 w-4 text-red-400" />
      case "excel":
        return <FileText className="h-4 w-4 text-green-400" />
      default:
        return <File className="h-4 w-4 text-muted-foreground" />
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-4xl h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
          <h2 className="text-xl font-semibold text-foreground">Settings</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-accent/50">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <Tabs defaultValue="general" className="flex-1 overflow-hidden">
          <div className="border-b border-border">
            <TabsList className="px-6">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="mcp">MCP Servers</TabsTrigger>
              <TabsTrigger value="uploads">Uploads</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="general" className="p-6 space-y-8">
              {/* System Prompt Section */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="system-prompt" className="text-base font-medium text-foreground">
                    Custom System Prompt
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Define how the AI should behave and respond to your messages.
                  </p>
                </div>
                <Textarea
                  id="system-prompt"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="You are a helpful AI assistant. You should be concise, accurate, and professional in your responses..."
                  className="min-h-[120px] bg-muted/50 border-border focus:border-primary text-foreground placeholder:text-muted-foreground"
                  rows={6}
                />
              </div>

              {/* Additional Settings */}
              <div className="space-y-4">
                <Label className="text-base font-medium text-foreground">Additional Settings</Label>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm text-foreground">Enable conversation history</Label>
                      <p className="text-xs text-muted-foreground">Save conversations locally for future reference</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm text-foreground">Auto-scroll to bottom</Label>
                      <p className="text-xs text-muted-foreground">Automatically scroll to new messages</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm text-foreground">Show typing indicators</Label>
                      <p className="text-xs text-muted-foreground">Display when the AI is generating responses</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="mcp" className="p-6 space-y-8">
              {/* MCP Configuration Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium text-foreground">
                      Model Context Protocol (MCP) Servers
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Configure MCP servers to extend the AI's capabilities with external tools and data sources.
                    </p>
                  </div>
                  <Button
                    onClick={addMcpServer}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Server
                  </Button>
                </div>

                <div className="space-y-4">
                  {mcpServers.map((server) => (
                    <div key={server.id} className="bg-muted/30 rounded-lg p-4 border border-border space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Switch
                            checked={server.enabled}
                            onCheckedChange={(enabled) => updateMcpServer(server.id, { enabled })}
                          />
                          <Input
                            value={server.name}
                            onChange={(e) => updateMcpServer(server.id, { name: e.target.value })}
                            className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground w-48"
                            placeholder="Server name"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMcpServer(server.id)}
                          className="hover:bg-destructive/20 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm text-foreground">Command</Label>
                          <Input
                            value={server.command}
                            onChange={(e) => updateMcpServer(server.id, { command: e.target.value })}
                            className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground"
                            placeholder="npx, node, python, etc."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm text-foreground">Arguments</Label>
                          <Input
                            value={server.args.join(" ")}
                            onChange={(e) => updateServerArgs(server.id, e.target.value)}
                            className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground"
                            placeholder="@modelcontextprotocol/server-filesystem /path"
                          />
                        </div>
                      </div>

                      {server.enabled && (
                        <div className="text-xs text-green-400 bg-green-500/10 rounded px-2 py-1 inline-block">
                          ✓ Server enabled
                        </div>
                      )}
                    </div>
                  ))}

                  {mcpServers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No MCP servers configured.</p>
                      <p className="text-sm mt-1">Add a server to extend the AI's capabilities.</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="uploads" className="p-6 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium text-foreground">Uploaded Files</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Manage files you've uploaded for use in conversations.
                    </p>
                  </div>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                </div>

                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="min-w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          File
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Size
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {uploadedFiles.map((file) => (
                        <tr key={file.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              {getFileIcon(file.type)}
                              <span className="ml-2 text-sm text-foreground">{file.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">{file.size}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">{file.date}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hover:bg-destructive/20 hover:text-destructive"
                              onClick={() => deleteFile(file.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {uploadedFiles.length === 0 && (
                  <div className="text-center py-12 border border-dashed border-border rounded-lg">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No files uploaded yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Upload files to use them in your conversations</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="p-6 space-y-8">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium text-foreground">Advanced Settings</Label>
                  <p className="text-sm text-muted-foreground mt-1">Configure advanced options for the application.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm text-foreground">Developer Mode</Label>
                      <p className="text-xs text-muted-foreground">Enable advanced debugging features</p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm text-foreground">Experimental Features</Label>
                      <p className="text-xs text-muted-foreground">Try new features before they're released</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-border bg-card/50 flex-shrink-0">
          <Button variant="ghost" onClick={onClose} className="hover:bg-accent/50">
            Cancel
          </Button>
          <Button onClick={saveSettings} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  )
}
