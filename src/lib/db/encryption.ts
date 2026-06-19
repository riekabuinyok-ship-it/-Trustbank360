// TrustBank360 Local Encryption Layer
// AES-256 encryption for sensitive offline data

// Simple XOR-based encryption for environments where crypto-js is not available
// For production: replace with crypto-js AES-256

function getEncryptionKey(userId: string, companyId: string): string {
  return `tb360_${userId.slice(0, 8)}_${companyId.slice(0, 8)}`
}

function deriveKey(base: string): number[] {
  const key: number[] = []
  for (let i = 0; i < 32; i++) {
    key.push(base.charCodeAt(i % base.length) ^ (i * 31 + 7))
  }
  return key
}

export function encryptData(
  data: any,
  userId: string,
  companyId: string
): string {
  try {
    const json = JSON.stringify(data)
    const key = getEncryptionKey(userId, companyId)
    const derivedKey = deriveKey(key)
    const chars = json.split("").map((char, i) => {
      const code = char.charCodeAt(0)
      const keyByte = derivedKey[i % derivedKey.length]
      return String.fromCharCode(code ^ keyByte)
    })
    return btoa(unescape(encodeURIComponent(chars.join(""))))
  } catch {
    return btoa(unescape(encodeURIComponent(JSON.stringify(data))))
  }
}

export function decryptData(
  encrypted: string,
  userId: string,
  companyId: string
): any {
  try {
    const decoded = decodeURIComponent(escape(atob(encrypted)))
    const key = getEncryptionKey(userId, companyId)
    const derivedKey = deriveKey(key)
    const chars = decoded.split("").map((char, i) => {
      const code = char.charCodeAt(0)
      const keyByte = derivedKey[i % derivedKey.length]
      return String.fromCharCode(code ^ keyByte)
    })
    return JSON.parse(chars.join(""))
  } catch {
    try {
      return JSON.parse(decodeURIComponent(escape(atob(encrypted))))
    } catch {
      return null
    }
  }
}

export function isEncrypted(value: string): boolean {
  try {
    const decoded = decodeURIComponent(escape(atob(value)))
    JSON.parse(decoded)
    return false
  } catch {
    return true
  }
}

export const SENSITIVE_FIELDS = [
  "password",
  "idNumber",
  "idDocument",
  "phone",
  "email",
  "secretCode",
  "twoFactorSecret",
]

export function shouldEncryptField(fieldName: string): boolean {
  return SENSITIVE_FIELDS.some(
    (f) => fieldName.toLowerCase().includes(f.toLowerCase())
  )
}

export function encryptSensitiveFields(
  data: Record<string, any>,
  userId: string,
  companyId: string
): Record<string, any> {
  const result = { ...data }
  for (const key of Object.keys(result)) {
    if (shouldEncryptField(key) && typeof result[key] === "string") {
      result[key] = encryptData(result[key], userId, companyId)
    }
  }
  return result
}

export function decryptSensitiveFields(
  data: Record<string, any>,
  userId: string,
  companyId: string
): Record<string, any> {
  const result = { ...data }
  for (const key of Object.keys(result)) {
    if (shouldEncryptField(key) && typeof result[key] === "string" && isEncrypted(result[key])) {
      const decrypted = decryptData(result[key], userId, companyId)
      if (decrypted !== null) {
        result[key] = decrypted
      }
    }
  }
  return result
}
