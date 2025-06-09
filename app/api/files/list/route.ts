import { NextRequest, NextResponse } from 'next/server'
import { StorageService } from '@/lib/services/storage.service'
import { storageConfig } from '@/lib/config/storage'
import { getUserId } from '@/lib/utils/auth'

export async function GET(req: NextRequest) {
  try {
    // Get user ID
    const userId = getUserId()

    // Initialize storage service
    const storage = new StorageService(
      storageConfig.AZURE_STORAGE_CONNECTION_STRING,
      storageConfig.AZURE_STORAGE_CONTAINER_NAME
    )

    // Get user files
    const files = await storage.listUserFiles(userId)

    // Format file information
    const fileList = files.map(blobName => {
      const parts = blobName.split('/')
      const fileName = parts[parts.length - 1]
      const timestamp = fileName.split('-')[0]
      const originalName = fileName.substring(timestamp.length + 1)
      
      return {
        blobName,
        fileName: originalName,
        uploadedAt: new Date(parseInt(timestamp)),
        size: null, // Would need additional API call to get size
      }
    })

    return NextResponse.json({
      files: fileList,
      count: fileList.length,
    })

  } catch (error) {
    console.error('File listing error:', error)
    
    if (error instanceof Error && error.message.includes('Invalid Azure Storage configuration')) {
      return NextResponse.json(
        { error: 'Storage service is not properly configured' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to list files' },
      { status: 500 }
    )
  }
}