import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

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
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload
}

export function verifyRefresh(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload
}


