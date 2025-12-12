import { Router } from 'express'
import { healthRouter } from './health.js'
import { authRouter } from './auth.js'
import { documentRouter } from './documents.js'
import { adminRouter } from './admin.js'
import { statsRouter } from './stats.js'

const router = Router()

router.use('/health', healthRouter)
router.use('/auth', authRouter)
router.use('/documents', documentRouter)
router.use('/admin', adminRouter)
router.use('/stats', statsRouter)

export default router

