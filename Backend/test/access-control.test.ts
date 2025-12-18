process.env.NODE_ENV = 'test'
process.env.JWT_ACCESS_SECRET = 'test-access-secret-32chars-minimum!!'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32chars-minimum!!'
process.env.CRYPTO_KEY = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' // 64 hex
process.env.CLIENT_ORIGIN = 'http://localhost:5173'
process.env.MONGO_URI = 'mongodb://localhost/test'

import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import app from '../src/app.js'
import { signAccess } from '../src/utils/tokens.js'
import { User } from '../src/models/User.js'
import { Document } from '../src/models/Document.js'
import { encrypt, hashEmail, hashPassword } from '../src/utils/crypto.js'

let mongo: MongoMemoryServer

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())
})

beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Document.deleteMany({})])
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

async function createUser(role: 'USER' | 'MANAGER' | 'ADMIN') {
  const email = `${role.toLowerCase()}@test.com`
  const emailHash = hashEmail(email)
  const emailEnc = encrypt(email)
  const nameEnc = encrypt(`${role} User`)
  const passwordHash = await hashPassword('Password123!')
  return User.create({
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
}

async function createDocument(ownerId: mongoose.Types.ObjectId) {
  const dataEnc = encrypt('dummy-data')
  const nameEnc = encrypt('dummy-name.pdf')
  return Document.create({
    ownerId,
    encryptedData: dataEnc.content,
    dataIv: dataEnc.iv,
    dataTag: dataEnc.tag,
    nameEnc: nameEnc.content,
    nameIv: nameEnc.iv,
    nameTag: nameEnc.tag,
    type: 'application/pdf',
    version: 1,
    allowedUsers: []
  })
}

describe('Contrôles d’accès backend', () => {
  it("USER ne peut pas accéder aux routes d'administration", async () => {
    const user = await createUser('USER')
    const token = signAccess(user.id, 'USER')

    const res = await request(app)
      .get('/admin/logs')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
  })

  it('MANAGER ne peut pas supprimer les documents des autres', async () => {
    const owner = await createUser('USER')
    const manager = await createUser('MANAGER')
    const doc = await createDocument(owner.id)
    const token = signAccess(manager.id, 'MANAGER')

    const res = await request(app)
      .delete(`/documents/${doc.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
  })

  it('ADMIN voit tous les documents, même ceux des autres utilisateurs', async () => {
    const owner = await createUser('USER')
    const admin = await createUser('ADMIN')
    await createDocument(owner.id)
    const token = signAccess(admin.id, 'ADMIN')

    const res = await request(app)
      .get('/documents')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBe(1)
    expect(res.body[0]).toMatchObject({ ownerId: owner.id.toString() })
  })

  it('MANAGER voit ses docs et ceux des USER, mais ne peut pas supprimer', async () => {
    const user = await createUser('USER')
    const manager = await createUser('MANAGER')
    const admin = await createUser('ADMIN')
    await createDocument(user.id)
    await createDocument(manager.id)
    const tokenManager = signAccess(manager.id, 'MANAGER')
    const tokenAdmin = signAccess(admin.id, 'ADMIN')

    const list = await request(app)
      .get('/documents')
      .set('Authorization', `Bearer ${tokenManager}`)

    expect(list.status).toBe(200)
    expect(list.body.length).toBe(2)

    const docToDelete = list.body.find((d: any) => d.ownerId === user.id.toString())
    const del = await request(app)
      .delete(`/documents/${docToDelete._id}`)
      .set('Authorization', `Bearer ${tokenManager}`)
    expect(del.status).toBe(403)

    // Admin peut supprimer pour laisser la base propre
    const delAdmin = await request(app)
      .delete(`/documents/${docToDelete._id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
    expect(delAdmin.status).toBe(200)
  })

  it('USER peut télécharger ses propres documents mais pas les supprimer', async () => {
    const user = await createUser('USER')
    const token = signAccess(user.id, 'USER')
    const doc = await createDocument(user.id)

    const download = await request(app)
      .get(`/documents/${doc.id}/download`)
      .set('Authorization', `Bearer ${token}`)
    expect(download.status).toBe(200)
    expect(download.body).toHaveProperty('base64')

    const del = await request(app)
      .delete(`/documents/${doc.id}`)
      .set('Authorization', `Bearer ${token}`)
    expect(del.status).toBe(403)
  })
})

