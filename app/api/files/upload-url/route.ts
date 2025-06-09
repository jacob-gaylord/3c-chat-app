import { NextRequest, NextResponse } from 'next/server'
import { StorageService } from '@/lib/services/storage.service'
import { storageConfig } from '@/lib/config/storage'
import { getUserId } from '@/lib/utils/auth'
import { FileUploadRequest } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const body: FileUploadRequest = await req.json()
    const { fileName, fileSize, fileType } = body

    // Validate required fields
    if (!fileName || !fileSize) {
      return NextResponse.json(
        { error: 'fileName and fileSize are required' },
        { status: 400 }
      )
    }

    // Get user ID from request
    const userId = getUserId()

    // Initialize storage service
    const storage = new StorageService(
      storageConfig.AZURE_STORAGE_CONNECTION_STRING,
      storageConfig.AZURE_STORAGE_CONTAINER_NAME
    )

    // Validate file
    try {
      storage.validateFile(
        fileName,
        fileSize,
        storageConfig.allowedFileTypes,
        storageConfig.maxFileSize
      )
    } catch (validationError) {
      return NextResponse.json(
        { error: validationError instanceof Error ? validationError.message : 'File validation failed' },
        { status: 400 }
      )
    }

    // Generate upload URL
    const uploadUrl = await storage.generateUploadUrl(fileName, userId)

    return NextResponse.json({
      ...uploadUrl,
      maxFileSize: storageConfig.maxFileSize,
      allowedTypes: storageConfig.allowedFileTypes,
    })

  } catch (error) {
    console.error('Upload URL generation error:', error)
    
    if (error instanceof Error && error.message.includes('Invalid Azure Storage configuration')) {
      return NextResponse.json(
        { error: 'Storage service is not properly configured' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    )
  }
}