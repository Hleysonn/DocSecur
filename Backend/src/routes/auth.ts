import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../middlewares/validate.js'
import { User } from '../models/User.js'
import { Session } from '../models/Session.js'
import { encrypt, hashEmail, hashPassword, verifyPassword, decrypt } from '../utils/crypto.js'
import { signAccess, signRefresh, verifyRefresh, blacklistAccessToken, verifyAccess } from '../utils/tokens.js'
import { writeLog } from '../services/logService.js'
import { requireAuth } from '../middlewares/auth.js'
import { env } from '../config/env.js'

const router = Router()

const REFRESH_COOKIE_NAME = 'refreshToken'
const refreshCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.NODE_ENV === 'production',
  path: '/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
}

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2),
    role: z.enum(['USER', 'MANAGER', 'ADMIN']).optional()
  })
})

router.post('/register', validate(registerSchema), async (req, res) => {
  const { email, password, name, role = 'USER' } = req.body
  const emailHash = hashEmail(email)
  const exists = await User.findOne({ emailHash })
  if (exists) return res.status(409).json({ error: 'Email déjà utilisé' })

  const emailEnc = encrypt(email)
  const nameEnc = encrypt(name)
  const passwordHash = await hashPassword(password)

  const user = await User.create({
    emailHash,
    emailEnc: emailEnc.content,
    emailIv: emailEnc.iv,
    emailTag: emailEnc.tag,
    nameEnc: nameEnc.content,
    nameIv: nameEnc.iv,
    nameTag: nameEnc.tag,
    passwordHash,
    role
  })

  await writeLog({
    userId: user.id,
    action: 'user_register',
    resource: 'auth'
  })

  res.status(201).json({ id: user.id, role: user.role })
})

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8)
  })
})

router.post('/login', validate(loginSchema), async (req, res) => {
  const { email, password } = req.body
  const emailHash = hashEmail(email)
  const user = await User.findOne({ emailHash })
  if (!user) return res.status(401).json({ error: 'Identifiants invalides' })

  const ok = await verifyPassword(user.passwordHash, password)
  if (!ok) return res.status(401).json({ error: 'Identifiants invalides' })

  const accessToken = signAccess(user.id, user.role)
  const refreshToken = signRefresh(user.id, user.role)
  const name = decrypt({ content: user.nameEnc, iv: user.nameIv, tag: user.nameTag })

  await Session.create({
    userId: user.id,
    tokenHash: hashEmail(refreshToken),
    ip: req.ip,
    userAgent: req.get('user-agent') ?? undefined,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  })

  await writeLog({
    userId: user.id,
    action: 'login',
    resource: 'auth',
    ip: req.ip,
    userAgent: req.get('user-agent') ?? undefined
  })

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions)
  res.json({ accessToken, refreshToken, role: user.role, userId: user.id, name })
})

router.get('/csrf', (req, res) => {
  const token = (req as any).csrfToken?.()
  res.json({ csrfToken: token })
})

router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME]
  if (!refreshToken) return res.status(401).json({ error: 'Refresh manquant' })
  let payload
  try {
    payload = verifyRefresh(refreshToken)
  } catch {
    return res.status(401).json({ error: 'Refresh invalide' })
  }

  const session = await Session.findOne({
    userId: payload.sub,
    tokenHash: hashEmail(refreshToken)
  })
  if (!session) return res.status(401).json({ error: 'Session expirée' })
  if (session.expiresAt.getTime() < Date.now()) {
    await session.deleteOne()
    return res.status(401).json({ error: 'Session expirée' })
  }

  const accessToken = signAccess(payload.sub, payload.role)
  const newRefresh = signRefresh(payload.sub, payload.role)
  session.tokenHash = hashEmail(newRefresh)
  
  session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await session.save()

  res.cookie(REFRESH_COOKIE_NAME, newRefresh, refreshCookieOptions)
  res.json({ accessToken })
})

router.post('/logout', async (req, res) => {
  const authHeader = req.headers.authorization
  const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME]
  if (refreshToken) {
    await Session.deleteMany({ tokenHash: hashEmail(refreshToken) })
  }
  if (accessToken) {
    try {
      const decoded: any = verifyAccess(accessToken)
      const expMs = decoded?.exp ? decoded.exp * 1000 : undefined
      await blacklistAccessToken(accessToken, expMs)
    } catch {
      // ignore invalid token
    }
  }
  res.clearCookie(REFRESH_COOKIE_NAME, { path: refreshCookieOptions.path })
  res.json({ ok: true })
})

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user!.id)
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })
  res.json({
    id: user.id,
    role: user.role,
    email: decrypt({ content: user.emailEnc, iv: user.emailIv, tag: user.emailTag }),
    name: decrypt({ content: user.nameEnc, iv: user.nameIv, tag: user.nameTag })
  })
})

const profileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    password: z.string().min(8).optional()
  })
})

router.patch('/profile', requireAuth, validate(profileSchema), async (req, res) => {
  const user = await User.findById(req.user!.id)
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

  if (req.body.name) {
    const encName = encrypt(req.body.name)
    user.nameEnc = encName.content
    user.nameIv = encName.iv
    user.nameTag = encName.tag
  }
  if (req.body.password) {
    user.passwordHash = await hashPassword(req.body.password)
  }
  await user.save()

  await writeLog({
    userId: user.id,
    action: 'profile_update',
    resource: 'auth'
  })

  res.json({ ok: true })
})

export const authRouter = router


