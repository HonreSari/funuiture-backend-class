import express from "express";
import { changeLanguage } from "../../../controllers/api/profileController";

const router = express.Router();

// Test route
router.get("/test", (req, res) => {
    console.log("Test route is working!")
  res.status(200).json({ message: "Test route is working!" });
});

router.post("/change-language", changeLanguage);

// Debug logging
router.use((req, res, next) => {
  console.log(`Incoming request to: ${req.originalUrl}`, {
    method: req.method,
    path: req.path,
    query: req.query
  });
  next();
});

export default router;
