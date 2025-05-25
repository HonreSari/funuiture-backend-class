import { Queue } from "bullmq";
import { Redis } from "ioredis";

const connection = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  // password: process.env.REDIS_PASSWORD || undefined,
});

const ImageQueue = new Queue("imageQueue", { connection });

export default ImageQueue;
