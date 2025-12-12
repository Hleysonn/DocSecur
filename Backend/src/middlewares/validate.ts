import type { NextFunction, Request, Response } from 'express'
import { ZodSchema } from 'zod'

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query
    })
    if (!result.success) {
      return res.status(400).json({ error: result.error.flatten() })
    }
    next()
  }
}

