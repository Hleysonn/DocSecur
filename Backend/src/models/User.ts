import { Schema, model, type Document } from 'mongoose'
import { roles, type Role } from '../types/roles.js'

export interface UserDocument extends Document {
  emailHash: string
  emailEnc: string
  emailIv: string
  emailTag: string
  nameEnc: string
  nameIv: string
  nameTag: string
  passwordHash: string
  role: Role
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<UserDocument>(
  {
    emailHash: { type: String, required: true, unique: true, index: true },
    emailEnc: { type: String, required: true },
    emailIv: { type: String, required: true },
    emailTag: { type: String, required: true },
    nameEnc: { type: String, required: true },
    nameIv: { type: String, required: true },
    nameTag: { type: String, required: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: roles, default: 'USER' }
  },
  { timestamps: true }
)

export const User = model<UserDocument>('User', userSchema)

