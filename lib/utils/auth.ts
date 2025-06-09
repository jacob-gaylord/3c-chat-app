import { headers } from 'next/headers'

/**
 * Extract user ID from request headers
 * In a real application, this would validate JWT tokens or session cookies
 */
export function getUserId(req?: Request): string {
  // For demo purposes, we'll use a combination of IP and user agent
  // In production, this should be replaced with proper authentication
  const headersList = headers()
  const userAgent = headersList.get('user-agent') || 'anonymous'
  const forwarded = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
  
  // Create a simple hash for demo user ID
  const userIdentifier = `${forwarded}-${userAgent}`
  const hash = btoa(userIdentifier).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)
  
  return `user_${hash}`
}

/**
 * Validate user permissions for file operations
 */
export function validateUserAccess(userId: string, blobName: string): boolean {
  // Check if the user owns the file (blob name should start with userId)
  return blobName.startsWith(`${userId}/`)
}

/**
 * Extract user ID from blob name
 */
export function extractUserIdFromBlobName(blobName: string): string | null {
  const parts = blobName.split('/')
  if (parts.length >= 2 && parts[0].startsWith('user_')) {
    return parts[0]
  }
  return null
}