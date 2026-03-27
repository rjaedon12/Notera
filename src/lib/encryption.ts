import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

/**
 * AES-256-GCM encryption / decryption for admin password recovery.
 *
 * We store a SECOND copy of the user's password encrypted with AES-256-GCM.
 * The original bcrypt hash is still used for all authentication.
 * Only the admin can decrypt after re-authenticating.
 * The encryption key lives in ADMIN_PASSWORD_ENCRYPTION_KEY (64-hex-char / 32 bytes).
 *
 * STORAGE FORMAT (Base64):  iv(12) + authTag(16) + ciphertext(…)
 */

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12 // 96 bits recommended for GCM
const TAG_LENGTH = 16

function getKey(): Buffer {
  const hex = process.env.ADMIN_PASSWORD_ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    throw new Error(
      "ADMIN_PASSWORD_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). " +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    )
  }
  return Buffer.from(hex, "hex")
}

/** Encrypt a plaintext password → base64 blob for DB storage. */
export function encryptPassword(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()

  // Combine: iv + tag + ciphertext
  const combined = Buffer.concat([iv, tag, encrypted])
  return combined.toString("base64")
}

/** Decrypt a base64 blob back into the plaintext password. */
export function decryptPassword(blob: string): string {
  const key = getKey()
  const data = Buffer.from(blob, "base64")

  const iv = data.subarray(0, IV_LENGTH)
  const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH)
  const ciphertext = data.subarray(IV_LENGTH + TAG_LENGTH)

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ])

  return decrypted.toString("utf8")
}
