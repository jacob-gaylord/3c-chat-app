import { describe, it, expect, beforeEach } from 'vitest'
import { validateAzureConfig } from '@/lib/config/azure'

describe('Azure Configuration', () => {
  describe('validateAzureConfig', () => {
    it('should validate correct configuration', () => {
      const config = {
        AZURE_OPENAI_API_KEY: 'test-key-12345',
        AZURE_OPENAI_ENDPOINT: 'https://test.openai.azure.com',
        AZURE_OPENAI_DEPLOYMENT_NAME: 'test-deployment',
        AZURE_OPENAI_API_VERSION: '2024-02-15-preview',
      }

      const result = validateAzureConfig(config)
      expect(result).toEqual(config)
    })

    it('should use default API version when not provided', () => {
      const config = {
        AZURE_OPENAI_API_KEY: 'test-key-12345',
        AZURE_OPENAI_ENDPOINT: 'https://test.openai.azure.com',
        AZURE_OPENAI_DEPLOYMENT_NAME: 'test-deployment',
      }

      const result = validateAzureConfig(config)
      expect(result.AZURE_OPENAI_API_VERSION).toBe('2024-02-15-preview')
    })

    it('should throw error for missing API key', () => {
      const config = {
        AZURE_OPENAI_ENDPOINT: 'https://test.openai.azure.com',
        AZURE_OPENAI_DEPLOYMENT_NAME: 'test-deployment',
      }

      expect(() => validateAzureConfig(config)).toThrow()
    })

    it('should throw error for empty API key', () => {
      const config = {
        AZURE_OPENAI_API_KEY: '',
        AZURE_OPENAI_ENDPOINT: 'https://test.openai.azure.com',
        AZURE_OPENAI_DEPLOYMENT_NAME: 'test-deployment',
      }

      expect(() => validateAzureConfig(config)).toThrow()
    })

    it('should throw error for invalid endpoint URL', () => {
      const config = {
        AZURE_OPENAI_API_KEY: 'test-key-12345',
        AZURE_OPENAI_ENDPOINT: 'not-a-url',
        AZURE_OPENAI_DEPLOYMENT_NAME: 'test-deployment',
      }

      expect(() => validateAzureConfig(config)).toThrow()
    })

    it('should throw error for missing deployment name', () => {
      const config = {
        AZURE_OPENAI_API_KEY: 'test-key-12345',
        AZURE_OPENAI_ENDPOINT: 'https://test.openai.azure.com',
        AZURE_OPENAI_DEPLOYMENT_NAME: '',
      }

      expect(() => validateAzureConfig(config)).toThrow()
    })

    it('should validate custom API version', () => {
      const config = {
        AZURE_OPENAI_API_KEY: 'test-key-12345',
        AZURE_OPENAI_ENDPOINT: 'https://test.openai.azure.com',
        AZURE_OPENAI_DEPLOYMENT_NAME: 'test-deployment',
        AZURE_OPENAI_API_VERSION: '2023-12-01-preview',
      }

      const result = validateAzureConfig(config)
      expect(result.AZURE_OPENAI_API_VERSION).toBe('2023-12-01-preview')
    })
  })
})