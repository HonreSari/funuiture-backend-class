import express from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors"; //cross origin resource sharing(CORS)
import morgan from "morgan";
import { limiter } from "./middlewares/rateLimiter";

export const app = express();
app.
app
  .use(express.urlencoded({ extended: true }))
  .use(express.json())
  .use(morgan("dev"))
  .use(cors())
  .use(helmet())
  .use(compression())
  .use(limiter)

app.get('/health', (req, res) => {
    res.status(200).json({ message: "Server is alright"})
})
