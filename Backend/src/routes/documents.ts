import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import multer from 'multer'
import { z } from 'zod'
import { requireAuth } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { Document } from '../models/Document.js'
import { User } from '../models/User.js'
import { decrypt, encrypt } from '../utils/crypto.js'
import { writeLog } from '../services/logService.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })
const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes upload, réessayez plus tard.' }
})

const downloadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de téléchargements, réessayez plus tard.' }
})

const createSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    type: z.string().min(1),
    data: z.string().min(1) // base64 ou texte
  })
})

router.post('/', requireAuth, validate(createSchema), async (req, res) => {
  const { name, type, data } = req.body
  const encName = encrypt(name)
  const encData = encrypt(data)

  const doc = await Document.create({
    ownerId: req.user!.id,
    encryptedData: encData.content,
    dataIv: encData.iv,
    dataTag: encData.tag,
    nameEnc: encName.content,
    nameIv: encName.iv,
    nameTag: encName.tag,
    type,
    version: 1,
    allowedUsers: []
  })

  await writeLog({
    userId: req.user!.id,
    action: 'document_create',
    resource: doc.id,
    ip: req.ip,
    userAgent: req.get('user-agent') ?? undefined
  })

  res.status(201).json({ id: doc.id, version: doc.version, type: doc.type })
})

// Upload multipart (PDF, DOCX, XLSX)
router.post(
  '/upload',
  requireAuth,
  uploadLimiter,
  upload.single('file'),
  async (req, res) => {
    const file = req.file
    if (!file) return res.status(400).json({ error: 'Fichier requis' })
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Type de fichier non autorisé' })
    }
    const base64 = file.buffer.toString('base64')
    const encName = encrypt(file.originalname)
    const encData = encrypt(base64)

    const doc = await Document.create({
      ownerId: req.user!.id,
      encryptedData: encData.content,
      dataIv: encData.iv,
      dataTag: encData.tag,
      nameEnc: encName.content,
      nameIv: encName.iv,
      nameTag: encName.tag,
      type: file.mimetype,
      version: 1,
      allowedUsers: []
    })

    await writeLog({
      userId: req.user!.id,
      action: 'document_upload',
      resource: doc.id,
      ip: req.ip,
      userAgent: req.get('user-agent') ?? undefined
    })

    res.status(201).json({ id: doc.id, version: doc.version, type: doc.type })
  }
)

router.get('/', requireAuth, async (req, res) => {
  const role = req.user!.role
  if (role === 'ADMIN') {
    const docs = await Document.find({ isDeleted: false })
      .select('ownerId type version createdAt updatedAt')
      .lean()
    const withPermissions = docs.map((doc) => ({
      ...doc,
      canDelete: true,
      canDownload: true
    }))
    return res.json(withPermissions)
  }

  if (role === 'MANAGER') {
    const userIds = await User.find({ role: 'USER' }).select('_id')
    const userIdStrings = userIds.map((u) => u._id.toString())
    const docs = await Document.find({
      isDeleted: false,
      $or: [
        { ownerId: req.user!.id },
        { ownerId: { $in: userIdStrings } },
        { allowedUsers: req.user!.id }
      ]
    })
      .select('ownerId type version createdAt updatedAt')
      .lean()
    const withPermissions = docs.map((doc) => ({
      ...doc,
      canDelete: false, // managers n'ont jamais le droit de supprimer
      canDownload: true
    }))
    return res.json(withPermissions)
  }

  const docs = await Document.find({
    isDeleted: false,
    $or: [{ ownerId: req.user!.id }, { allowedUsers: req.user!.id }]
  })
    .select('ownerId type version createdAt updatedAt')
    .lean()
  const withPermissions = docs.map((doc) => ({
    ...doc,
    canDelete: false, // un USER ne peut plus supprimer, même ses propres docs
    canDownload: true
  }))
  res.json(withPermissions)
})

router.delete('/:id', requireAuth, async (req, res) => {
  const doc = await Document.findById(req.params.id)
  if (!doc || doc.isDeleted) return res.status(404).json({ error: 'Document introuvable' })
  const isAdmin = req.user!.role === 'ADMIN'
  const isManager = req.user!.role === 'MANAGER'
  const isUser = req.user!.role === 'USER'

  // Seul un ADMIN peut supprimer désormais
  if (!isAdmin) return res.status(403).json({ error: 'Non autorisé' })

  doc.isDeleted = true
  await doc.save()
  await writeLog({
    userId: req.user!.id,
    action: 'document_delete',
    resource: doc.id,
    ip: req.ip,
    userAgent: req.get('user-agent') ?? undefined
  })
  res.json({ ok: true })
})

const shareSchema = z.object({
  body: z.object({
    userId: z.string().min(1)
  })
})

router.post('/:id/share', requireAuth, validate(shareSchema), async (req, res) => {
  const doc = await Document.findById(req.params.id)
  if (!doc || doc.isDeleted) return res.status(404).json({ error: 'Document introuvable' })
  if (doc.ownerId.toString() !== req.user!.id) {
    return res.status(403).json({ error: 'Non autorisé' })
  }
  if (!doc.allowedUsers.includes(req.body.userId)) {
    doc.allowedUsers.push(req.body.userId)
    await doc.save()
  }
  await writeLog({
    userId: req.user!.id,
    action: 'document_share',
    resource: doc.id
  })
  res.json({ ok: true })
})

const versionSchema = z.object({
  body: z.object({
    data: z.string().min(1)
  })
})

router.post('/:id/version', requireAuth, validate(versionSchema), async (req, res) => {
  const doc = await Document.findById(req.params.id)
  if (!doc || doc.isDeleted) return res.status(404).json({ error: 'Document introuvable' })
  if (doc.ownerId.toString() !== req.user!.id) {
    return res.status(403).json({ error: 'Non autorisé' })
  }
  const encData = encrypt(req.body.data)
  doc.encryptedData = encData.content
  doc.dataIv = encData.iv
  doc.dataTag = encData.tag
  doc.version += 1
  await doc.save()
  await writeLog({
    userId: req.user!.id,
    action: 'document_version',
    resource: doc.id
  })
  res.json({ id: doc.id, version: doc.version })
})

router.get('/:id', requireAuth, async (req, res) => {
  const doc = await Document.findById(req.params.id)
  if (!doc || doc.isDeleted) return res.status(404).json({ error: 'Document introuvable' })
  const isOwner = doc.ownerId.toString() === req.user!.id
  const isAllowed = doc.allowedUsers.map(String).includes(req.user!.id)
  const isAdmin = req.user!.role === 'ADMIN'
  let ownerRole: string | null = null
  if (req.user!.role === 'MANAGER') {
    const owner = await User.findById(doc.ownerId).select('role')
    ownerRole = owner?.role ?? null
  }
  const managerCanSee = req.user!.role === 'MANAGER' && (isOwner || ownerRole === 'USER' || isAllowed)
  if (!isOwner && !isAllowed && !isAdmin && !managerCanSee) return res.status(403).json({ error: 'Non autorisé' })
  res.json({
    id: doc.id,
    encryptedData: doc.encryptedData,
    dataIv: doc.dataIv,
    dataTag: doc.dataTag,
    nameEnc: doc.nameEnc,
    nameIv: doc.nameIv,
    nameTag: doc.nameTag,
    type: doc.type,
    version: doc.version
  })
})

router.get('/:id/download', requireAuth, downloadLimiter, async (req, res) => {
  const doc = await Document.findById(req.params.id)
  if (!doc || doc.isDeleted) return res.status(404).json({ error: 'Document introuvable' })
  const isOwner = doc.ownerId.toString() === req.user!.id
  const isAllowed = doc.allowedUsers.map(String).includes(req.user!.id)
  const isAdmin = req.user!.role === 'ADMIN'
  let ownerRole: string | null = null
  if (req.user!.role === 'MANAGER') {
    const owner = await User.findById(doc.ownerId).select('role')
    ownerRole = owner?.role ?? null
  }
  const managerCanSee = req.user!.role === 'MANAGER' && (isOwner || ownerRole === 'USER' || isAllowed)
  if (!isOwner && !isAllowed && !isAdmin && !managerCanSee) return res.status(403).json({ error: 'Non autorisé' })

  const base64 = decrypt({ content: doc.encryptedData, iv: doc.dataIv, tag: doc.dataTag })
  const filename = decrypt({ content: doc.nameEnc, iv: doc.nameIv, tag: doc.nameTag })

  res.json({
    name: filename,
    mime: doc.type,
    base64
  })
})

export const documentRouter = router

