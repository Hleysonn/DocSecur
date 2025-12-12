import type { NextFunction, Request, Response } from 'express'
import { verifyAccess } from '../utils/tokens.js'

declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: string; role: string }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined
  if (!token) return res.status(401).json({ error: 'Non authentifié' })
  try {
    const payload = verifyAccess(token)
    req.user = { id: payload.sub, role: payload.role }
    next()
  } catch {
    return res.status(401).json({ error: 'Token invalide' })
  }
}

export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Non authentifié' })
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès refusé' })
    }
    next()
  }
}

