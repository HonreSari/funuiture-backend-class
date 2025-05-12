import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors"; //cross origin resource sharing(CORS)
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { auth } from '../src/middlewares/auth'
import authRoutes from "../src/routes/v1/auth";
import userRoutes from "../src/routes/v1/admin/user"
import viewRoutes from "./routes/web/view";
// import { get404 } from "./controllers/web/errorController";

export const app = express();
app.use(express.json());
app.use(cookieParser());
//auth routes
app.use("/api/v1", authRoutes);
app.use('/api/v1/admin', auth ,userRoutes)
// ejs view templete
app.set("view engine", "ejs");
app.set("views", "./src/views");
app
.use(morgan("dev"))
.use(express.urlencoded({ extended: true }))
.use(cors())
.use(helmet())
.use(compression());


app.use(express.static("public"));
app.use(viewRoutes);
// app.use(get404)
// app.get('/health', (req, res) => {
//     res.status(200).json({ message: "Server is alright"})
// })

app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  const status = error.status || 500;
  const message = error.message || "Server error";
  const errorCode = error.code || "Error_code";
  res.status(status).json({ message, error: errorCode });
});
