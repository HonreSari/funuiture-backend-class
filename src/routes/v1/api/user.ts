import express from "express";
import { changeLanguage, testPermission } from "../../../controllers/api/profileController";
import { auth } from "../../../middlewares/auth";
const router = express.Router();


// Test route
// router.get("/test", (req, res) => {
//     console.log("Test route is working!")
//   res.status(200).json({ message: "Test route is working!" });
// });

router.post("/change-language", changeLanguage);
router.get('/test-permission', auth , testPermission)
// Debug logging
// router.use((req, res, next) => {
//   console.log(`Incoming request to: ${req.originalUrl}`, {
//     method: req.method,
//     path: req.path,
//     query: req.query
//   });
//   next();
// });

export default router;
