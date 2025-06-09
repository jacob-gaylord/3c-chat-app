import { 
  BlobServiceClient, 
  generateBlobSASQueryParameters, 
  BlobSASPermissions,
  StorageSharedKeyCredential,
  ContainerClient
} from '@azure/storage-blob'
import { UploadUrl } from '@/lib/types'

export class StorageService {
  private blobServiceClient: BlobServiceClient
  private containerName: string

  constructor(connectionString: string, containerName: string = 'uploads') {
    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
    this.containerName = containerName
  }

  /**
   * Generate a secure upload URL with SAS token for direct browser upload
   */
  async generateUploadUrl(fileName: string, userId: string): Promise<UploadUrl> {
    // Sanitize filename to prevent path traversal
    const sanitizedFileName = this.sanitizeFileName(fileName)
    const blobName = `${userId}/${Date.now()}-${sanitizedFileName}`
    
    // Ensure container exists
    await this.ensureContainerExists()
    
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName)
    const blockBlobClient = containerClient.getBlockBlobClient(blobName)
    
    // Generate SAS token with write permissions only
    const sasToken = await this.generateSASToken(blobName)
    
    return {
      uploadUrl: `${blockBlobClient.url}?${sasToken}`,
      blobName,
      expiresAt: new Date(Date.now() + 3600 * 1000) // 1 hour
    }
  }

  /**
   * Generate a download URL with SAS token for file access
   */
  async generateDownloadUrl(blobName: string, expiresInMinutes: number = 60): Promise<string> {
    const sasToken = await this.generateSASToken(blobName, 'r', expiresInMinutes)
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName)
    const blockBlobClient = containerClient.getBlockBlobClient(blobName)
    
    return `${blockBlobClient.url}?${sasToken}`
  }

  /**
   * Check if a file exists in storage
   */
  async fileExists(blobName: string): Promise<boolean> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName)
      const blockBlobClient = containerClient.getBlockBlobClient(blobName)
      const response = await blockBlobClient.exists()
      return response
    } catch (error) {
      console.error('Error checking file existence:', error)
      return false
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(blobName: string): Promise<boolean> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName)
      const blockBlobClient = containerClient.getBlockBlobClient(blobName)
      await blockBlobClient.deleteIfExists()
      return true
    } catch (error) {
      console.error('Error deleting file:', error)
      return false
    }
  }

  /**
   * List files for a specific user
   */
  async listUserFiles(userId: string): Promise<string[]> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName)
      const files: string[] = []
      
      for await (const blob of containerClient.listBlobsFlat({ prefix: `${userId}/` })) {
        files.push(blob.name)
      }
      
      return files
    } catch (error) {
      console.error('Error listing user files:', error)
      return []
    }
  }

  /**
   * Validate file type and size
   */
  validateFile(fileName: string, fileSize: number, allowedTypes: string[], maxSize: number): void {
    // Check file size
    if (fileSize > maxSize) {
      throw new Error(`File size exceeds maximum limit of ${Math.round(maxSize / (1024 * 1024))}MB`)
    }

    // Check file type
    const fileExtension = fileName.toLowerCase().split('.').pop()
    const mimeType = this.getMimeType(fileName)
    
    const isAllowed = allowedTypes.some(allowedType => {
      if (allowedType === '*') return true
      if (allowedType.endsWith('/*')) {
        const category = allowedType.split('/')[0]
        return mimeType.startsWith(category + '/')
      }
      if (allowedType.startsWith('.')) {
        return fileName.toLowerCase().endsWith(allowedType.toLowerCase())
      }
      return mimeType === allowedType
    })

    if (!isAllowed) {
      throw new Error(`File type not allowed. Supported types: ${allowedTypes.join(', ')}`)
    }
  }

  private async ensureContainerExists(): Promise<void> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName)
      await containerClient.createIfNotExists({
        access: 'blob' // Allow anonymous read access to blobs (but not list)
      })
    } catch (error) {
      console.error('Error creating container:', error)
      throw new Error('Failed to initialize storage container')
    }
  }

  private async generateSASToken(
    blobName: string, 
    permissions: string = 'w', 
    expiresInMinutes: number = 60
  ): Promise<string> {
    try {
      const credential = this.blobServiceClient.credential as StorageSharedKeyCredential
      
      if (!credential) {
        throw new Error('Storage credential not available for SAS token generation')
      }

      const sasOptions = {
        containerName: this.containerName,
        blobName,
        permissions: BlobSASPermissions.parse(permissions),
        startsOn: new Date(),
        expiresOn: new Date(Date.now() + expiresInMinutes * 60 * 1000),
      }

      return generateBlobSASQueryParameters(sasOptions, credential).toString()
    } catch (error) {
      console.error('Error generating SAS token:', error)
      throw new Error('Failed to generate upload URL')
    }
  }

  private sanitizeFileName(fileName: string): string {
    // Remove or replace dangerous characters
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .substring(0, 200) // Limit length
  }

  private getMimeType(fileName: string): string {
    const extension = fileName.toLowerCase().split('.').pop()
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'txt': 'text/plain',
      'csv': 'text/csv',
    }
    
    return mimeTypes[extension || ''] || 'application/octet-stream'
  }
}