import express from "express";
import authRoutes from "./admin";
import adminRoutes from "./admin";
import userRoutes from "./api/user";
import { auth } from "../../middlewares/auth";
import { authorise } from "../../middlewares/authories";
import { maintenance } from "../../middlewares/maintenance";
const router = express.Router();

router.use("/api/v1", authRoutes);
router.use("/api/v1/user", userRoutes);
router.use("/api/v1/admin", auth, authorise(true, "ADMIN"), adminRoutes);
// router.use("/api/v1", maintenance, authRoutes);
// router.use("/api/v1/user", maintenance, userRoutes);
// router.use(
//   "/api/v1/admin",
//   maintenance,
//   auth,
//   authorise(true, "ADMIN"),
//   adminRoutes
// );

export default router;
