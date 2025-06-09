import { z } from 'zod'

const envSchema = z.object({
  AZURE_OPENAI_API_KEY: z.string().min(1, 'Azure OpenAI API key is required'),
  AZURE_OPENAI_ENDPOINT: z.string().url('Azure OpenAI endpoint must be a valid URL'),
  AZURE_OPENAI_DEPLOYMENT_NAME: z.string().min(1, 'Azure OpenAI deployment name is required'),
  AZURE_OPENAI_API_VERSION: z.string().default('2024-02-15-preview'),
})

export type AzureConfig = z.infer<typeof envSchema>

export const azureConfig = (() => {
  try {
    return envSchema.parse({
      AZURE_OPENAI_API_KEY: process.env.AZURE_OPENAI_API_KEY,
      AZURE_OPENAI_ENDPOINT: process.env.AZURE_OPENAI_ENDPOINT,
      AZURE_OPENAI_DEPLOYMENT_NAME: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      AZURE_OPENAI_API_VERSION: process.env.AZURE_OPENAI_API_VERSION,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n')
      throw new Error(`Invalid Azure OpenAI configuration:\n${missingVars}`)
    }
    throw error
  }
})()

export const validateAzureConfig = (config: Record<string, unknown>): AzureConfig => {
  return envSchema.parse(config)
}