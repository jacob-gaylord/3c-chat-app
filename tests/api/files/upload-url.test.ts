import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock storage config first
vi.mock('@/lib/config/storage', () => ({
  storageConfig: {
    AZURE_STORAGE_CONNECTION_STRING: 'DefaultEndpointsProtocol=https;AccountName=test;AccountKey=key;EndpointSuffix=core.windows.net',
    AZURE_STORAGE_CONTAINER_NAME: 'test-uploads',
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedFileTypes: ['image/*', 'application/pdf', '.txt'],
  }
}))

// Mock auth utility
vi.mock('@/lib/utils/auth', () => ({
  getUserId: vi.fn(() => 'test-user-123')
}))

// Mock storage service
const mockGenerateUploadUrl = vi.fn()
const mockValidateFile = vi.fn()

vi.mock('@/lib/services/storage.service', () => ({
  StorageService: vi.fn().mockImplementation(() => ({
    generateUploadUrl: mockGenerateUploadUrl,
    validateFile: mockValidateFile,
  }))
}))

import { POST } from '@/app/api/files/upload-url/route'

describe('/api/files/upload-url', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock successful upload URL generation
    mockGenerateUploadUrl.mockResolvedValue({
      uploadUrl: 'https://test.blob.core.windows.net/uploads/test-user-123/1640995200000-test.jpg?sv=2023-11-03&sig=test',
      blobName: 'test-user-123/1640995200000-test.jpg',
      expiresAt: new Date('2024-01-01T12:00:00Z')
    })
    
    // Mock successful validation
    mockValidateFile.mockImplementation(() => {})
  })

  it('should generate upload URL for valid request', async () => {
    const request = new Request('http://localhost:3000/api/files/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: 'test-image.jpg',
        fileSize: 5000000,
        fileType: 'image/jpeg'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.ok).toBe(true)
    expect(data).toHaveProperty('uploadUrl')
    expect(data).toHaveProperty('blobName')
    expect(data).toHaveProperty('expiresAt')
    expect(data).toHaveProperty('maxFileSize')
    expect(data).toHaveProperty('allowedTypes')
    
    expect(mockGenerateUploadUrl).toHaveBeenCalledWith('test-image.jpg', 'test-user-123')
    expect(mockValidateFile).toHaveBeenCalled()
  })

  it('should return 400 for missing fileName', async () => {
    const request = new Request('http://localhost:3000/api/files/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileSize: 5000000
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('fileName and fileSize are required')
  })

  it('should return 400 for missing fileSize', async () => {
    const request = new Request('http://localhost:3000/api/files/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: 'test.jpg'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('fileName and fileSize are required')
  })

  it('should return 400 for file validation errors', async () => {
    mockValidateFile.mockImplementation(() => {
      throw new Error('File size exceeds maximum limit of 100MB')
    })

    const request = new Request('http://localhost:3000/api/files/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: 'huge-file.jpg',
        fileSize: 200 * 1024 * 1024 // 200MB
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('File size exceeds maximum limit of 100MB')
  })

  it('should return 400 for invalid file types', async () => {
    mockValidateFile.mockImplementation(() => {
      throw new Error('File type not allowed. Supported types: image/*, application/pdf, .txt')
    })

    const request = new Request('http://localhost:3000/api/files/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: 'malware.exe',
        fileSize: 5000000
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('File type not allowed')
  })

  it('should return 503 for storage configuration errors', async () => {
    mockGenerateUploadUrl.mockRejectedValue(new Error('Invalid Azure Storage configuration'))

    const request = new Request('http://localhost:3000/api/files/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: 'test.jpg',
        fileSize: 5000000
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.error).toBe('Storage service is not properly configured')
  })

  it('should return 500 for general errors', async () => {
    mockGenerateUploadUrl.mockRejectedValue(new Error('Unexpected error'))

    const request = new Request('http://localhost:3000/api/files/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: 'test.jpg',
        fileSize: 5000000
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to generate upload URL')
  })

  it('should handle JSON parsing errors', async () => {
    const request = new Request('http://localhost:3000/api/files/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to generate upload URL')
  })
})