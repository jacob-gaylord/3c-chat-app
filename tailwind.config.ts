import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary colors from the palette
        primary: {
          DEFAULT: "#005285", // Teal blue
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#294258", // Dark blue-gray
          foreground: "#ffffff",
        },
        accent: {
          DEFAULT: "#6bb7d0", // Light blue
          foreground: "#000000",
        },
        // Custom colors from palette
        slate: {
          700: "#58585b", // Dark gray
          800: "#294258", // Dark blue-gray
          900: "#1a1a1a", // Darker for backgrounds
        },
        blue: {
          500: "#6bb7d0", // Light blue
          600: "#005285", // Teal blue
          700: "#004066", // Darker teal
        },
        teal: {
          500: "#008eb9", // Cyan
          600: "#005285", // Teal blue
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}

export default config
