import { Router } from 'express'
import * as registrationController from './registration.controller'
import { authenticate } from '../../middlewares/authenticate'
import { authorize } from '../../middlewares/authorize'
import { validate } from '../../middlewares/validate'
import { createRegistrationSchema } from './registration.schema'

const router = Router()

// Cliente confirma asistencia
router.post(
  '/',
  authenticate,
  authorize('CLIENT'),
  validate(createRegistrationSchema),
  registrationController.create
)

// Cliente ve su propia confirmación
router.get('/me', authenticate, registrationController.getMine)

// Ventas/Admin ven todas las confirmaciones
router.get(
  '/',
  authenticate,
  authorize('SALES', 'ADMIN'),
  registrationController.getAll
)

export default router