export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

export interface ChatError {
  message: string
  code?: string
}

export interface StreamingState {
  isStreaming: boolean
  currentMessageId?: string
}

export interface UploadUrl {
  uploadUrl: string
  blobName: string
  expiresAt: Date
}

export interface FileUploadRequest {
  fileName: string
  fileSize: number
  fileType?: string
}

export interface StorageConfig {
  connectionString: string
  containerName: string
  maxFileSize: number
  allowedFileTypes: string[]
}