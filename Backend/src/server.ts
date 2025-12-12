import mongoose from 'mongoose'
import app from './app.js'
import { env } from './config/env.js'

async function bootstrap() {
  await mongoose.connect(env.MONGO_URI)
  app.listen(env.PORT, () => {
    console.log(`SecureDocs API prête sur le port ${env.PORT}`)
  })
}

bootstrap().catch((err) => {
  console.error('Impossible de démarrer le serveur', err)
  process.exit(1)
})


