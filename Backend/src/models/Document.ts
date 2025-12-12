import { Schema, model, type Document as Doc } from 'mongoose'

export interface DocumentDocument extends Doc {
  ownerId: Schema.Types.ObjectId
  encryptedData: string
  dataIv: string
  dataTag: string
  nameEnc: string
  nameIv: string
  nameTag: string
  type: string
  version: number
  allowedUsers: Schema.Types.ObjectId[]
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}

const documentSchema = new Schema<DocumentDocument>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    encryptedData: { type: String, required: true },
    dataIv: { type: String, required: true },
    dataTag: { type: String, required: true },
    nameEnc: { type: String, required: true },
    nameIv: { type: String, required: true },
    nameTag: { type: String, required: true },
    type: { type: String, required: true },
    version: { type: Number, default: 1 },
    allowedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isDeleted: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
)

export const Document = model<DocumentDocument>('Document', documentSchema)

