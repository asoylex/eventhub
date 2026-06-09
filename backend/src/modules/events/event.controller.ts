import { Request, Response, NextFunction } from 'express'
import * as eventService from './event.service'
import { sendSuccess } from '../../utils/apiResponse'

export const getEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const event = await eventService.getActiveEvent()
    sendSuccess(res, event, 'Event retrieved')
  } catch (err) {
    next(err)
  }
}