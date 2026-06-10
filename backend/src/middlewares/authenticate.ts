import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken, TokenPayload } from '../utils/jwt'
import { sendError } from '../utils/apiResponse'

export interface AuthRequest extends Request {
  user?: TokenPayload
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization
  const queryToken = req.query.token as string

  // Lee del header primero, si no existe lee del query param (para SSE)
  let token: string | undefined

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1]
  } else if (queryToken) {
    token = queryToken
  }

  if (!token) {
    return sendError(res, 'No token provided', 401)
  }

  try {
    const payload = verifyAccessToken(token)
    req.user = payload
    next()
  } catch {
    return sendError(res, 'Invalid or expired token', 401)
  }
}