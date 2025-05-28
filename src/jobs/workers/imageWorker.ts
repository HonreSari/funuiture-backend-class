import { Worker } from "bullmq";
import { Redis } from "ioredis";
import sharp from "sharp";
import path from "path";

const connection = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  // password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Disble retrying failed requests
});

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
  { connection }
);

imageWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully.`);
});

imageWorker.on("failed", (job: any, err) => {
  console.error(`Job ${job.id} failed with error: ${err.message}`);
});
