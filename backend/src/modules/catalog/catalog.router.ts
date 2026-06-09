import { Router } from 'express'
import * as catalogController from './catalog.controller'

const router = Router()

router.get('/', catalogController.getItems)

export default router