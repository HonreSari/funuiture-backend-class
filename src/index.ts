import "dotenv/config";
import { app } from "./app";
import helmet from "helmet";
import compression from "compression";
import cors from "cors"; //cross origin resource sharing(CORS)
import morgan from "morgan";

const PORT = process.env.PORT;
// These are "environment-aware" or global middlewares
const corsOptions = {
  origin: ["https://example1.com", "https://localhost.5173"], // allowed origins
  methods: ["GET", "POST", "PUT", "DELETE"], // allowed HTTP methods
  credentials: true, // allow cookies if needed
};
app.use(morgan("dev"));
app.use(cors(corsOptions));
app.use(helmet());
app.use(compression());

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
