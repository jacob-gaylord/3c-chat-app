import { NextRequest, NextResponse } from 'next/server'
import { StorageService } from '@/lib/services/storage.service'
import { storageConfig } from '@/lib/config/storage'
import { getUserId, validateUserAccess } from '@/lib/utils/auth'

export async function POST(req: NextRequest) {
  try {
    const { blobName, expiresInMinutes = 60 } = await req.json()

    // Validate required fields
    if (!blobName) {
      return NextResponse.json(
        { error: 'blobName is required' },
        { status: 400 }
      )
    }

    // Get user ID and validate access
    const userId = getUserId()
    if (!validateUserAccess(userId, blobName)) {
      return NextResponse.json(
        { error: 'Access denied to this file' },
        { status: 403 }
      )
    }

    // Initialize storage service
    const storage = new StorageService(
      storageConfig.AZURE_STORAGE_CONNECTION_STRING,
      storageConfig.AZURE_STORAGE_CONTAINER_NAME
    )

    // Check if file exists
    const exists = await storage.fileExists(blobName)
    if (!exists) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Generate download URL
    const downloadUrl = await storage.generateDownloadUrl(blobName, expiresInMinutes)

    return NextResponse.json({
      downloadUrl,
      blobName,
      expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
    })

  } catch (error) {
    console.error('Download URL generation error:', error)
    
    if (error instanceof Error && error.message.includes('Invalid Azure Storage configuration')) {
      return NextResponse.json(
        { error: 'Storage service is not properly configured' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate download URL' },
      { status: 500 }
    )
  }
}