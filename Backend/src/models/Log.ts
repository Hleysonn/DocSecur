import { Schema, model, type Document } from 'mongoose'

export interface LogDocument extends Document {
  userId?: Schema.Types.ObjectId
  action: string
  resource: string
  ip?: string
  userAgent?: string
  createdAt: Date
}

const logSchema = new Schema<LogDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    resource: { type: String, required: true },
    ip: String,
    userAgent: String
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

export const Log = model<LogDocument>('Log', logSchema)

