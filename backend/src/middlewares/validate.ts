import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'
import { sendError } from '../utils/apiResponse'

export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return sendError(
        res,
        'Validation error',
        422,
        result.error.flatten().fieldErrors
      )
    }
    req.body = result.data
    next()
  }