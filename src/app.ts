import express, { Request, Response, NextFunction } from "express";

import cookieParser from "cookie-parser";
import i18next from "i18next";
import Backend from "i18next-fs-backend";
import middleware from "i18next-http-middleware";
import path from "path";

import routes from './routes/v1'
import viewRoutes from "./routes/web/view";
// import { get404 } from "./controllers/web/errorController";

export const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));
app.use(viewRoutes);
// app.use(get404)
// app.get('/health', (req, res) => {
//     res.status(200).json({ message: "Server is alright"})
// })
i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    backend: {
      loadPath: path.join(
        process.cwd(),
        "src/locales",
        "{{lng}}",
        "{{ns}}.json"
      ),
    },
    detection: {
      order: ["querystring", "cookie"],
      caches: ["cookie"],
    },
    fallbackLng: "en",
    preload: ["en", "mm"],
  });
app.use(middleware.handle(i18next));

//auth routes
app.use(routes);

// ejs view templete
app.set("view engine", "ejs");
app.set("views", "./src/views");

app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  const status = error.status || 500;
  const message = error.message || "Server error";
  const errorCode = error.code || "Error_code";
  res.status(status).json({ message, error: errorCode });
});
