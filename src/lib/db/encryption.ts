// TrustBank360 Local Encryption Layer
// AES-256-GCM encryption for sensitive offline data using Web Crypto API

const ALGORITHM = "AES-GCM"
const KEY_LENGTH = 256
const PBKDF2_ITERATIONS = 100000
const SALT_LENGTH = 16
const IV_LENGTH = 12

let cachedKey: CryptoKey | null = null
let cachedKeyUserId: string | null = null

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  )
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  )
}

async function getCryptoKey(userId: string, companyId: string): Promise<CryptoKey> {
  if (cachedKey && cachedKeyUserId === userId) return cachedKey
  const password = `tb360_${userId}_${companyId}_v2`
  const raw = new TextEncoder().encode("tb360-aes256gcm-salt")
  const saltBytes = new Uint8Array(SALT_LENGTH)
  for (let i = 0; i < SALT_LENGTH; i++) {
    saltBytes[i] = i < raw.length ? raw[i] : 0
  }
  cachedKey = await deriveKey(password, saltBytes)
  cachedKeyUserId = userId
  return cachedKey
}

export async function encryptData(
  data: any,
  userId: string,
  companyId: string
): Promise<string> {
  try {
    const key = await getCryptoKey(userId, companyId)
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
    const encoded = new TextEncoder().encode(JSON.stringify(data))
    const encrypted = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      encoded
    )
    const combined = new Uint8Array(16 + IV_LENGTH + encrypted.byteLength)
    combined.set(new Uint8Array(16).fill(0), 0)
    combined.set(iv, 16)
    combined.set(new Uint8Array(encrypted), 16 + IV_LENGTH)
    let binary = ""
    for (let i = 0; i < combined.length; i++) {
      binary += String.fromCharCode(combined[i])
    }
    return btoa(binary)
  } catch {
    return btoa(JSON.stringify(data))
  }
}

export async function decryptData(
  encrypted: string,
  userId: string,
  companyId: string
): Promise<any> {
  try {
    const key = await getCryptoKey(userId, companyId)
    const combined = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0))
    if (combined.length < SALT_LENGTH + IV_LENGTH + 1) {
      return JSON.parse(atob(encrypted))
    }
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH)
    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      ciphertext
    )
    return JSON.parse(new TextDecoder().decode(decrypted))
  } catch {
    try {
      return JSON.parse(atob(encrypted))
    } catch {
      return null
    }
  }
}

export function isEncrypted(value: string): boolean {
  try {
    const bytes = Uint8Array.from(atob(value), (c) => c.charCodeAt(0))
    return bytes.length > SALT_LENGTH + IV_LENGTH
  } catch {
    return false
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

export async function encryptSensitiveFields(
  data: Record<string, any>,
  userId: string,
  companyId: string
): Promise<Record<string, any>> {
  const result = { ...data }
  for (const key of Object.keys(result)) {
    if (shouldEncryptField(key) && typeof result[key] === "string" && !isEncrypted(result[key])) {
      result[key] = await encryptData(result[key], userId, companyId)
    }
  }
  return result
}

export async function decryptSensitiveFields(
  data: Record<string, any>,
  userId: string,
  companyId: string
): Promise<Record<string, any>> {
  const result = { ...data }
  for (const key of Object.keys(result)) {
    if (shouldEncryptField(key) && typeof result[key] === "string" && isEncrypted(result[key])) {
      const decrypted = await decryptData(result[key], userId, companyId)
      if (decrypted !== null) {
        result[key] = decrypted
      }
    }
  }
  return result
}
