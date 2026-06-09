import { Router } from 'express'
import * as eventController from './event.controller'

const router = Router()

router.get('/active', eventController.getEvent)

export default router