import { Schema, model, type Document } from 'mongoose'

export interface TokenBlocklistDocument extends Document {
  tokenHash: string
  expiresAt: Date
}

const tokenBlocklistSchema = new Schema<TokenBlocklistDocument>(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: false }
)

// TTL via expireAfterSeconds=0
tokenBlocklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const TokenBlocklist = model<TokenBlocklistDocument>('TokenBlocklist', tokenBlocklistSchema)


