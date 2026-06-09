import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middlewares/authenticate'
import * as registrationService from './registration.service'
import { sendSuccess } from '../../utils/apiResponse'

export const create = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const registration = await registrationService.createRegistration(
      req.user!.userId,
      req.body
    )
    sendSuccess(res, registration, 'Attendance confirmed successfully', 201)
  } catch (err) {
    next(err)
  }
}

export const getMine = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const registration = await registrationService.getMyRegistration(
      req.user!.userId
    )
    sendSuccess(res, registration, 'Registration retrieved')
  } catch (err) {
    next(err)
  }
}

export const getAll = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const registrations = await registrationService.getAllRegistrations()
    sendSuccess(res, registrations, 'Registrations retrieved')
  } catch (err) {
    next(err)
  }
}