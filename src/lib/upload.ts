const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_SIZE = 5 * 1024 * 1024

export interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateFileType(mimeType: string): ValidationResult {
  if (!ALLOWED_TYPES.includes(mimeType)) {
    return { valid: false, error: `Invalid file type. Allowed: JPG, PNG, WEBP. Got: ${mimeType}` }
  }
  return { valid: true }
}

export function validateFileSize(size: number): ValidationResult {
  if (size > MAX_SIZE) {
    return { valid: false, error: `File too large. Maximum is 5MB. Got: ${(size / 1024 / 1024).toFixed(1)}MB` }
  }
  if (size <= 0) {
    return { valid: false, error: "File is empty" }
  }
  return { valid: true }
}

export function validateImageDimensions(width: number, height: number): ValidationResult {
  if (width > 4096 || height > 4096) {
    return { valid: false, error: `Image dimensions too large. Maximum 4096x4096. Got: ${width}x${height}` }
  }
  if (width < 32 || height < 32) {
    return { valid: false, error: `Image dimensions too small. Minimum 32x32. Got: ${width}x${height}` }
  }
  return { valid: true }
}

export function validateFile(file: { mimeType: string; size: number; width?: number; height?: number }): ValidationResult {
  const typeCheck = validateFileType(file.mimeType)
  if (!typeCheck.valid) return typeCheck
  const sizeCheck = validateFileSize(file.size)
  if (!sizeCheck.valid) return sizeCheck
  if (file.width !== undefined && file.height !== undefined) {
    const dimCheck = validateImageDimensions(file.width, file.height)
    if (!dimCheck.valid) return dimCheck
  }
  return { valid: true }
}

export function getFileExtension(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  }
  return map[mimeType] || "bin"
}
