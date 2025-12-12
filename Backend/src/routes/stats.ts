import { Router } from 'express'
import mongoose from 'mongoose'
import { requireAuth } from '../middlewares/auth.js'
import { Document } from '../models/Document.js'
import { Log } from '../models/Log.js'
import { User } from '../models/User.js'

const router = Router()

router.get('/overview', requireAuth, async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user!.id)
  const isAdmin = req.user!.role === 'ADMIN'

  const baseMatch = { isDeleted: false }
  const docMatch = isAdmin
    ? baseMatch
    : {
        ...baseMatch,
        $or: [{ ownerId: userId }, { allowedUsers: userId }]
      }

  const [docsCount, typesAgg, recentDocs, recentLogs, usersCount] = await Promise.all([
    Document.countDocuments(docMatch),
    Document.aggregate([
      { $match: docMatch },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]),
    Document.find(docMatch)
      .sort({ createdAt: -1 })
      .limit(5)
      .select('type version createdAt'),
    Log.find(isAdmin ? {} : { userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('action resource createdAt'),
    isAdmin ? User.countDocuments() : Promise.resolve(undefined)
  ])

  const lastUpload = recentDocs[0]?.createdAt ?? null

  res.json({
    docsCount,
    lastUpload,
    types: typesAgg.map((t) => ({ type: t._id, count: t.count })),
    recentDocs,
    recentLogs,
    usersCount
  })
})

export const statsRouter = router

