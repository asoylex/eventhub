import { Router } from 'express'
import * as eventController from './event.controller'
import { authenticate } from '../../middlewares/authenticate'
import { authorize } from '../../middlewares/authorize'
import { validate } from '../../middlewares/validate'
import { createEventSchema, updateEventSchema } from './event.schema'

const router = Router()

router.get('/active', eventController.getEvent)

// Solo ADMIN
router.get(
  '/',
  authenticate,
  authorize('ADMIN'),
  eventController.getAllEvents
)



// router.post(
//   '/',
//   authenticate,
//   authorize('ADMIN'),
//   validate(createEventSchema),
//   eventController.createEvent
// )

router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(updateEventSchema),
  eventController.updateEvent
)

router.post(
  '/:id/reset',
  authenticate,
  authorize('ADMIN'),
  eventController.resetCount
)

export default router
