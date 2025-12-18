import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import { env } from '../config/env.js'
import { TokenBlocklist } from '../models/TokenBlocklist.js'

type JwtPayload = { sub: string; role: string; typ: 'access' | 'refresh' }

export function signAccess(userId: string, role: string) {
  return jwt.sign({ sub: userId, role, typ: 'access' }, env.JWT_ACCESS_SECRET, {
    expiresIn: '15m'
  })
}

export function signRefresh(userId: string, role: string) {
  return jwt.sign({ sub: userId, role, typ: 'refresh' }, env.JWT_REFRESH_SECRET, {
    expiresIn: '7d'
  })
}

export function verifyAccess(token: string) {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload
  return payload
}

export function verifyRefresh(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload
}

function hashToken(token: string) {
  // sha256 hex
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function blacklistAccessToken(token: string, expMs?: number) {
  // expMs = expiration timestamp (ms since epoch) to set TTL close to token expiry
  const hashed = hashToken(token)
  const expiresAt = expMs ? new Date(expMs) : new Date(Date.now() + 15 * 60 * 1000)
  try {
    await TokenBlocklist.create({ tokenHash: hashed, expiresAt })
  } catch (err) {
    // ignore duplicate errors (already blacklisted)
    if ((err as any).code !== 11000) throw err
  }
}

export async function isAccessTokenRevoked(token: string) {
  const hashed = hashToken(token)
  const found = await TokenBlocklist.findOne({ tokenHash: hashed })
  return Boolean(found)
}


