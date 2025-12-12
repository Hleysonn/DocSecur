import mongoose from 'mongoose'
import { env } from '../config/env.js'
import { User } from '../models/User.js'
import { Document } from '../models/Document.js'
import { Log } from '../models/Log.js'
import { Session } from '../models/Session.js'
import { encrypt, hashEmail, hashPassword, decrypt } from '../utils/crypto.js'

async function main() {
  await mongoose.connect(env.MONGO_URI)
  if (env.NODE_ENV === 'production') {
    throw new Error('Seed bloqué en production')
  }

  await Promise.all([
    User.deleteMany({}),
    Document.deleteMany({}),
    Log.deleteMany({}),
    Session.deleteMany({})
  ])

  const password = 'Password123!'

  const userDefs = [
    { email: 'admin@example.com', name: 'Admin Istrateur', role: 'ADMIN' as const },
    { email: 'manager@example.com', name: 'Mona Ger', role: 'MANAGER' as const },
    { email: 'user@example.com', name: 'Ulysse Eur', role: 'USER' as const }
  ]

  const users = await User.create(
    await Promise.all(userDefs.map((def) => buildUser(def, password)))
  )

  const docs = await Document.create([
    buildDoc(users[2].id, 'Plan Stratégique', 'pdf', ['encrypted content v1'], []),
    buildDoc(users[1].id, 'Budget 2025', 'xlsx', ['budget data v1'], [users[2].id])
  ])

  await Log.create([
    { userId: users[0].id, action: 'seed', resource: 'system' },
    { userId: users[1].id, action: 'document_create', resource: docs[1].id },
    { userId: users[2].id, action: 'document_view', resource: docs[0].id }
  ])

  console.log('Seed terminé :')
  console.log('- Comptes :')
  users.forEach((u) => console.log(`  • ${u.role} -> ${decryptEmail(u)} / ${password}`))
  console.log('- Documents :', docs.length)

  await mongoose.disconnect()
}

async function buildUser(
  def: { email: string; name: string; role: 'USER' | 'MANAGER' | 'ADMIN' },
  password: string
) {
  const emailEnc = encrypt(def.email)
  const nameEnc = encrypt(def.name)
  const passwordHash = await hashPassword(password)
  return {
    emailHash: hashEmail(def.email),
    emailEnc: emailEnc.content,
    emailIv: emailEnc.iv,
    emailTag: emailEnc.tag,
    nameEnc: nameEnc.content,
    nameIv: nameEnc.iv,
    nameTag: nameEnc.tag,
    passwordHash,
    role: def.role
  }
}

function buildDoc(
  ownerId: string,
  name: string,
  type: string,
  versions: string[],
  allowedUsers: string[]
) {
  const nameEnc = encrypt(name)
  const dataEnc = encrypt(versions[versions.length - 1])
  return {
    ownerId,
    encryptedData: dataEnc.content,
    dataIv: dataEnc.iv,
    dataTag: dataEnc.tag,
    nameEnc: nameEnc.content,
    nameIv: nameEnc.iv,
    nameTag: nameEnc.tag,
    type,
    version: versions.length,
    allowedUsers
  }
}

function decryptEmail(user: { emailEnc: string; emailIv: string; emailTag: string }) {
  // Ne pas exposer en prod — ici uniquement pour afficher les comptes seed.
  try {
    return decrypt({ content: user.emailEnc, iv: user.emailIv, tag: user.emailTag })
  } catch {
    return 'n/a'
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

