import { Log } from '../models/Log.js'

export async function writeLog(params: {
  userId?: string
  action: string
  resource: string
  ip?: string
  userAgent?: string
}) {
  await Log.create({
    userId: params.userId,
    action: params.action,
    resource: params.resource,
    ip: params.ip,
    userAgent: params.userAgent
  })
}

