import type { NextFunction, Request, Response } from 'express'

// 404 handler
export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: 'Ressource introuvable' })
}

// Erreur globale handler
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (typeof err === 'object' && err !== null && 'code' in err && (err as any).code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ error: 'CSRF token invalide' })
  }

  const status = typeof err === 'object' && err !== null && 'status' in err
    ? Number((err as { status?: number }).status)
    : 500

  const message =
    typeof err === 'object' && err !== null && 'message' in err
      ? String((err as { message?: string }).message)
      : 'Erreur interne'

  if (status >= 500) {
    console.error(err)
  }

  res.status(status || 500).json({ error: message })
}


