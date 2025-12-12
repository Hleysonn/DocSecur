import compression from 'compression'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import morgan from 'morgan'
import routes from './routes/index.js'
import { env } from './config/env.js'
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js'

const app = express()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives, réessayez plus tard.' }
})

app.use(
  cors({
    origin: env.CLIENT_ORIGIN ?? true,
    credentials: true
  })
)
app.use(helmet())
app.use(morgan('dev'))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))
app.use(cookieParser())
app.use(compression())

app.use('/auth', authLimiter)
app.use(routes)

app.use(notFoundHandler)
app.use(errorHandler)

export default app


