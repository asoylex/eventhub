import { Router } from 'express'
import { authenticate, AuthRequest } from '../../middlewares/authenticate'
import { authorize } from '../../middlewares/authorize'
import { addClient } from './sse.service'

const router = Router()

router.get(
  '/stream',
  authenticate,
  authorize('SALES', 'ADMIN'),
  (req: AuthRequest, res) => {
    addClient(req.user!.userId, res)
  }
)


export default router