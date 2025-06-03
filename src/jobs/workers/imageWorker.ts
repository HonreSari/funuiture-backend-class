import { Worker } from "bullmq";
import { redis } from "../../../config/redisClient";
import sharp from "sharp";
import path from "path";

//create a worker to process the image optimization job
const imageWorker = new Worker(
  "imageQueue",
  async (job) => {
    const { filePath, fileName, width, height, quality } = job.data;
    const optimizeImagePath = path.join(
      __dirname,
      "../../..",
      "uploads",
      "optimize",
      fileName
    );
    await sharp(filePath)
      .resize(width, height)
      .webp({ quality })
      .toFile(optimizeImagePath);
  },
  { connection: redis }
);

imageWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully.`);
});

imageWorker.on("failed", (job: any, err) => {
  console.error(`Job ${job.id} failed with error: ${err.message}`);
});
