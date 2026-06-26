import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto'

// AES-256-GCM field encryption for credentials at rest.
// Key: ENCRYPTION_KEY (32-byte hex/base64) if set, else derived from JWT_SECRET.
// Encrypted values are tagged "enc:v1:" so legacy plaintext is detected and passed through.

const PREFIX = 'enc:v1:'

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY
  if (raw) {
    // Accept hex (64 chars) or base64 (44 chars) or any string → normalise to 32 bytes
    if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, 'hex')
    const b = Buffer.from(raw, 'base64')
    if (b.length === 32) return b
    return createHash('sha256').update(raw).digest()
  }
  // Fallback: derive a stable key from JWT_SECRET (always set in prod).
  return createHash('sha256').update(process.env.JWT_SECRET || 'dev-encryption-key').digest()
}

export function encrypt(plaintext: string): string {
  if (plaintext == null) return plaintext
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv)
  const ct = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return PREFIX + Buffer.concat([iv, tag, ct]).toString('base64')
}

export function decrypt(value: string): string {
  if (typeof value !== 'string' || !value.startsWith(PREFIX)) return value // legacy plaintext
  try {
    const data = Buffer.from(value.slice(PREFIX.length), 'base64')
    const iv = data.subarray(0, 12)
    const tag = data.subarray(12, 28)
    const ct = data.subarray(28)
    const decipher = createDecipheriv('aes-256-gcm', getKey(), iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8')
  } catch {
    return value // can't decrypt (key changed / corrupt) → return as-is, never crash
  }
}

// Encrypt a credentials object → store as { _enc: "<ciphertext>" }
export function encryptJson(obj: Record<string, any>): { _enc: string } {
  return { _enc: encrypt(JSON.stringify(obj || {})) }
}

// Reverse encryptJson; tolerant of legacy plaintext objects.
export function decryptJson(stored: any): Record<string, any> {
  if (stored && typeof stored === 'object' && typeof stored._enc === 'string') {
    try { return JSON.parse(decrypt(stored._enc)) } catch { return {} }
  }
  return stored && typeof stored === 'object' ? stored : {}
}
