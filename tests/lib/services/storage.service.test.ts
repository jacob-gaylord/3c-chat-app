import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StorageService } from '@/lib/services/storage.service'

// Mock Azure Storage Blob SDK
const mockGenerateBlobSASQueryParameters = vi.fn()
const mockCreateIfNotExists = vi.fn()
const mockExists = vi.fn()
const mockDeleteIfExists = vi.fn()
const mockListBlobsFlat = vi.fn()

vi.mock('@azure/storage-blob', () => ({
  BlobServiceClient: {
    fromConnectionString: vi.fn(() => ({
      getContainerClient: vi.fn(() => ({
        createIfNotExists: mockCreateIfNotExists,
        getBlockBlobClient: vi.fn(() => ({
          url: 'https://testaccount.blob.core.windows.net/uploads/user_123/test-file.txt',
          exists: mockExists,
          deleteIfExists: mockDeleteIfExists,
        })),
        listBlobsFlat: mockListBlobsFlat,
      })),
      credential: {
        accountName: 'testaccount',
        accountKey: 'testkey',
      },
    })),
  },
  generateBlobSASQueryParameters: mockGenerateBlobSASQueryParameters,
  BlobSASPermissions: {
    parse: vi.fn((permissions) => ({ permissions })),
  },
  StorageSharedKeyCredential: vi.fn(),
}))

describe('StorageService', () => {
  let storageService: StorageService
  const connectionString = 'DefaultEndpointsProtocol=https;AccountName=testaccount;AccountKey=testkey;EndpointSuffix=core.windows.net'

  beforeEach(() => {
    vi.clearAllMocks()
    storageService = new StorageService(connectionString, 'test-uploads')
    
    // Mock successful container creation
    mockCreateIfNotExists.mockResolvedValue({})
    
    // Mock SAS token generation
    mockGenerateBlobSASQueryParameters.mockReturnValue({
      toString: () => 'sv=2023-11-03&ss=b&srt=o&sp=w&se=2024-01-01T12:00:00Z&st=2024-01-01T11:00:00Z&spr=https&sig=testsignature'
    })
  })

  describe('generateUploadUrl', () => {
    it('should generate upload URL with SAS token', async () => {
      const result = await storageService.generateUploadUrl('test-file.txt', 'user_123')

      expect(result).toHaveProperty('uploadUrl')
      expect(result).toHaveProperty('blobName')
      expect(result).toHaveProperty('expiresAt')
      
      expect(result.uploadUrl).toContain('https://testaccount.blob.core.windows.net')
      expect(result.uploadUrl).toContain('sv=2023-11-03')
      expect(result.blobName).toMatch(/^user_123\/\d+-test-file\.txt$/)
      expect(result.expiresAt).toBeInstanceOf(Date)
    })

    it('should sanitize file names', async () => {
      const result = await storageService.generateUploadUrl('test file!@#$.txt', 'user_123')
      
      expect(result.blobName).toMatch(/user_123\/\d+-test_file____\.txt/)
    })

    it('should ensure container exists', async () => {
      await storageService.generateUploadUrl('test-file.txt', 'user_123')
      
      expect(mockCreateIfNotExists).toHaveBeenCalledWith({
        access: 'blob'
      })
    })
  })

  describe('generateDownloadUrl', () => {
    it('should generate download URL with read permissions', async () => {
      const result = await storageService.generateDownloadUrl('user_123/test-file.txt', 30)
      
      expect(result).toContain('https://testaccount.blob.core.windows.net')
      expect(result).toContain('sv=2023-11-03')
    })
  })

  describe('fileExists', () => {
    it('should return true when file exists', async () => {
      mockExists.mockResolvedValue(true)
      
      const result = await storageService.fileExists('user_123/test-file.txt')
      
      expect(result).toBe(true)
      expect(mockExists).toHaveBeenCalled()
    })

    it('should return false when file does not exist', async () => {
      mockExists.mockResolvedValue(false)
      
      const result = await storageService.fileExists('user_123/nonexistent-file.txt')
      
      expect(result).toBe(false)
    })

    it('should handle errors gracefully', async () => {
      mockExists.mockRejectedValue(new Error('Storage error'))
      
      const result = await storageService.fileExists('user_123/test-file.txt')
      
      expect(result).toBe(false)
    })
  })

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      mockDeleteIfExists.mockResolvedValue({})
      
      const result = await storageService.deleteFile('user_123/test-file.txt')
      
      expect(result).toBe(true)
      expect(mockDeleteIfExists).toHaveBeenCalled()
    })

    it('should handle deletion errors', async () => {
      mockDeleteIfExists.mockRejectedValue(new Error('Delete failed'))
      
      const result = await storageService.deleteFile('user_123/test-file.txt')
      
      expect(result).toBe(false)
    })
  })

  describe('listUserFiles', () => {
    it('should list files for a user', async () => {
      const mockBlobs = [
        { name: 'user_123/1640995200000-file1.txt' },
        { name: 'user_123/1640995300000-file2.pdf' },
      ]
      
      mockListBlobsFlat.mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          for (const blob of mockBlobs) {
            yield blob
          }
        }
      })
      
      const result = await storageService.listUserFiles('user_123')
      
      expect(result).toEqual([
        'user_123/1640995200000-file1.txt',
        'user_123/1640995300000-file2.pdf'
      ])
    })

    it('should handle listing errors', async () => {
      mockListBlobsFlat.mockImplementation(() => {
        throw new Error('List failed')
      })
      
      const result = await storageService.listUserFiles('user_123')
      
      expect(result).toEqual([])
    })
  })

  describe('validateFile', () => {
    const allowedTypes = ['image/*', 'application/pdf', '.txt']
    const maxSize = 10 * 1024 * 1024 // 10MB

    it('should validate allowed file types', () => {
      expect(() => {
        storageService.validateFile('test.jpg', 5000000, allowedTypes, maxSize)
      }).not.toThrow()
      
      expect(() => {
        storageService.validateFile('test.pdf', 5000000, allowedTypes, maxSize)
      }).not.toThrow()
      
      expect(() => {
        storageService.validateFile('test.txt', 5000000, allowedTypes, maxSize)
      }).not.toThrow()
    })

    it('should reject disallowed file types', () => {
      expect(() => {
        storageService.validateFile('test.exe', 5000000, allowedTypes, maxSize)
      }).toThrow('File type not allowed')
    })

    it('should validate file size', () => {
      expect(() => {
        storageService.validateFile('test.jpg', maxSize + 1, allowedTypes, maxSize)
      }).toThrow('File size exceeds maximum limit')
    })

    it('should allow files within size limit', () => {
      expect(() => {
        storageService.validateFile('test.jpg', maxSize - 1, allowedTypes, maxSize)
      }).not.toThrow()
    })

    it('should handle wildcard mime types', () => {
      expect(() => {
        storageService.validateFile('test.png', 5000000, ['image/*'], maxSize)
      }).not.toThrow()
      
      expect(() => {
        storageService.validateFile('test.gif', 5000000, ['image/*'], maxSize)
      }).not.toThrow()
    })

    it('should handle file extensions', () => {
      expect(() => {
        storageService.validateFile('document.docx', 5000000, ['.docx'], maxSize)
      }).not.toThrow()
      
      expect(() => {
        storageService.validateFile('Document.DOCX', 5000000, ['.docx'], maxSize)
      }).not.toThrow()
    })
  })
})