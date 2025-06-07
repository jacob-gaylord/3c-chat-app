import ChatInterface from "@/components/chat-interface"
import { ThemeProvider } from "@/components/theme-provider"

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <ChatInterface />
    </ThemeProvider>
  )
}
