import cors from "cors";
import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import i18next from "i18next";
import Backend from "i18next-fs-backend";
import middleware from "i18next-http-middleware";
import path from "path";

// import { limiter } from "./middlewares/rateLimiter";
import routes from "./routes/v1";
import { corsOptions } from "./services/corsService";
// import {
//   createOrUpdateSettingStatus,
//   getSettingStatus,
// } from "./services/settingService";

export const app = express();
app.use(cors(corsOptions));
app.set("view engine", "ejs");
app.set("views", "src/views");

app
  .use(morgan("dev"))
  .use(express.urlencoded({ extended: true }))
  .use(express.json())
  .use(cookieParser())
  .use(helmet())
  .use(compression());

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

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  next();
});

app.use(express.static("public"));
app.use(express.static("uploads"));

app.use(routes);

app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  const status = error.status || 500;
  const message = error.message || "Server Error";
  const errorCode = error.code || "Error_Code";
  res.status(status).json({ message, error: errorCode });
});

// cron.schedule("* 5 * * *", async () => {
//   console.log("Running a task every 5am For testing purpose");
//   const setting = await getSettingStatus("maintenance");
//   if (setting?.value === "true") {
//     await createOrUpdateSettingStatus("maintenance", "false");
//     console.log("Now maintenance mode is off");
//   }
// });
