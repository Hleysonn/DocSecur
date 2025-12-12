import crypto from 'crypto'
import argon2 from 'argon2'
import { env } from '../config/env.js'

// Clé symétrique en hex 64 chars -> 32 bytes
const key = Buffer.from(env.CRYPTO_KEY, 'hex')

export async function hashPassword(password: string) {
  return argon2.hash(password, { type: argon2.argon2id })
}

export async function verifyPassword(hash: string, password: string) {
  return argon2.verify(hash, password)
}
// Ici je chiffre les données avec AES-256-GCM
export function encrypt(text: string) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return {
    iv: iv.toString('hex'),
    content: encrypted.toString('hex'),
    tag: authTag.toString('hex')
  }
}

// Ici je décripte les données chiffrés avec la fonction encrypt
export function decrypt(payload: { iv: string; content: string; tag: string }) {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(payload.iv, 'hex')
  )
  decipher.setAuthTag(Buffer.from(payload.tag, 'hex'))
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.content, 'hex')),
    decipher.final()
  ])
  return decrypted.toString('utf8')
}

//Hash des emails pour le rendre anonymes
export function hashEmail(email: string) {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex')
}

//Token aléatoire en hexadécimal

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex')
}

