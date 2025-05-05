import express from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors"; //cross origin resource sharing(CORS)
import morgan from "morgan";
import { limiter } from "./middlewares/rateLimiter";
import viewRoutes from "./routes/web/view";
import { get404 } from "./controllers/web/errorController";

export const app = express();
app.set("view engine", "ejs");
app.set("views", "./src/views");
app
  .use(express.urlencoded({ extended: true }))
  .use(express.json())
  .use(morgan("dev"))
  .use(cors())
  .use(helmet())
  .use(compression())
  .use(limiter)

app.use(express.static("public"));
app.use(viewRoutes) 
app.use(get404)
app.get('/health', (req, res) => {
    res.status(200).json({ message: "Server is alright"})
})
