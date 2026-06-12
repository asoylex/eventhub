import { Request, Response, NextFunction } from 'express'
import * as eventService from './event.service'
import { sendSuccess } from '../../utils/apiResponse'
import { AuthRequest } from '../../middlewares/authenticate'

export const getEvent = async ( req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await eventService.getActiveEvent()
    sendSuccess(res, event, 'Event retrieved')
  } catch (err) {
    next(err)
  }
}

// export const createEvent = async (
//   req: AuthRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const event = await eventService.createEvent(req.body)
//     sendSuccess(res, event, 'Event created successfully', 201)
//   } catch (err) {
//     next(err)
//   }
// }

export const updateEvent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string
    const event = await eventService.updateEvent(id, req.body)
    sendSuccess(res, event, 'Event updated successfully')
  } catch (err) {
    next(err)
  }
}

export const resetCount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string
    const event = await eventService.resetConfirmedCount(id)
    sendSuccess(res, event, 'Confirmed count reset successfully')
  } catch (err) {
    next(err)
  }
}

export const getAllEvents = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const events = await eventService.getAllEvents()
    sendSuccess(res, events, 'Events retrieved')
  } catch (err) {
    next(err)
  }
}

