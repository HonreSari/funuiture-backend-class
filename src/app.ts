import express from 'express'
import helmet from 'helmet'
import compression from 'compression'
import cors from 'cors'   //cross origin resource sharing(CORS)
import morgan from 'morgan'

export const app = express()

app.use(express.urlencoded({ extended: true}))
app.use(express.json())
app.use(morgan('dev'))
app.use(cors())