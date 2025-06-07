// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Learn more: https://jestjs.io/docs/configuration#setupfilesafterenv-array

import '@testing-library/jest-dom'

// Mock DOM methods that aren't available in jsdom
Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
  value: jest.fn(),
  writable: true,
})

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'dark',
    setTheme: jest.fn(),
  }),
  ThemeProvider: ({ children }) => children,
}))

// Mock @ai-sdk/react
jest.mock('@ai-sdk/react', () => ({
  useChat: () => ({
    messages: [],
    input: '',
    handleInputChange: jest.fn(),
    handleSubmit: jest.fn(),
    isLoading: false,
    setMessages: jest.fn(),
  }),
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Sun: () => <div data-testid="sun-icon" />,
  Moon: () => <div data-testid="moon-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  PanelLeft: () => <div data-testid="panel-left-icon" />,
  ArrowUp: () => <div data-testid="arrow-up-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
  Search: () => <div data-testid="search-icon" />,
  Paperclip: () => <div data-testid="paperclip-icon" />,
}))

// Mock hooks
jest.mock('@/hooks/use-mobile', () => ({
  useMobile: () => false,
}))