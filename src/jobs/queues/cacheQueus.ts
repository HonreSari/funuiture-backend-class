import { Queue } from "bullmq";
import { redis } from "../../../config/redisClient";

const cacheQueue = new Queue("cache-invalidation", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3, // ? can try 3 times when incorrect
    backoff: {
      type: "exponential", // ? Exponential -> how many times do u waited for the mistatke to delay
      delay: 1000,
    },
    removeOnComplete: true, // !not important that much
    removeOnFail: 1000,
  },
});

export default cacheQueue;
