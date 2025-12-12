import { Schema, model, type Document } from 'mongoose'

export interface SessionDocument extends Document {
  userId: Schema.Types.ObjectId
  tokenHash: string
  ip?: string
  userAgent?: string
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

const sessionSchema = new Schema<SessionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, index: true },
    ip: String,
    userAgent: String,
    expiresAt: { type: Date, required: true, index: true }
  },
  { timestamps: true }
)

export const Session = model<SessionDocument>('Session', sessionSchema)

