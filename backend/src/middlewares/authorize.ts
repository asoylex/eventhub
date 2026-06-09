import { Response, NextFunction } from 'express'
import { AuthRequest } from './authenticate'
import { sendError } from '../utils/apiResponse'

export const authorize =
  (...roles: string[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401)
    }
    if (!roles.includes(req.user.role)) {
      return sendError(res, 'Forbidden: insufficient permissions', 403)
    }
    next()
  }