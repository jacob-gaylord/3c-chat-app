import { z } from 'zod'

const storageEnvSchema = z.object({
  AZURE_STORAGE_CONNECTION_STRING: z.string().min(1, 'Azure Storage connection string is required'),
  AZURE_STORAGE_CONTAINER_NAME: z.string().default('uploads'),
  MAX_FILE_SIZE_MB: z.string().default('100'),
  ALLOWED_FILE_TYPES: z.string().default('image/*,application/pdf,text/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx'),
})

export type StorageEnvConfig = z.infer<typeof storageEnvSchema>

export const storageConfig = (() => {
  try {
    const config = storageEnvSchema.parse({
      AZURE_STORAGE_CONNECTION_STRING: process.env.AZURE_STORAGE_CONNECTION_STRING,
      AZURE_STORAGE_CONTAINER_NAME: process.env.AZURE_STORAGE_CONTAINER_NAME,
      MAX_FILE_SIZE_MB: process.env.MAX_FILE_SIZE_MB,
      ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES,
    })

    return {
      ...config,
      maxFileSize: parseInt(config.MAX_FILE_SIZE_MB) * 1024 * 1024, // Convert MB to bytes
      allowedFileTypes: config.ALLOWED_FILE_TYPES.split(',').map(type => type.trim()),
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n')
      throw new Error(`Invalid Azure Storage configuration:\n${missingVars}`)
    }
    throw error
  }
})()

export const validateStorageConfig = (config: Record<string, unknown>): StorageEnvConfig => {
  return storageEnvSchema.parse(config)
}