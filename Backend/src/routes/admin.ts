import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, requireRole } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { User } from '../models/User.js'
import { Log } from '../models/Log.js'

const router = Router()

router.use(requireAuth, requireRole(['ADMIN']))

router.get('/users', async (_req, res) => {
  const users = await User.find().select('role createdAt updatedAt')
  res.json(users)
})

const roleSchema = z.object({
  body: z.object({
    role: z.enum(['USER', 'MANAGER', 'ADMIN'])
  })
})

router.patch('/users/:id/role', validate(roleSchema), async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role: req.body.role },
    { new: true }
  )
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })
  res.json({ id: user.id, role: user.role })
})

router.get('/logs', async (_req, res) => {
  const logs = await Log.find().sort({ createdAt: -1 }).limit(200)
  res.json(logs)
})

export const adminRouter = router


