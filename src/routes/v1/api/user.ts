import express from "express";
import {
  changeLanguage,
  testPermission,
  uploadProfile,
  uploadProfileMultiple,
  uploadProfileOptimize,
} from "../../../controllers/api/profileController";
import { auth } from "../../../middlewares/auth";
import upload, { uploadMemory } from "../../../middlewares/uploadFiles";
import {
  getInfinitePostsByPagination,
  getPost,
  getPostsByPagination,
} from "../../../controllers/api/postController";
const router = express.Router();

router.post("/change-language", changeLanguage);
router.get("/test-permission", auth, testPermission);
router.patch("/profile/upload", auth, upload.single("avatar"), uploadProfile);
router.patch(
  "/profile/upload/optimize",
  auth,
  upload.single("avatar"),
  uploadProfileOptimize
);
router.patch(
  "/profile/upload/multiple",
  auth,
  upload.array("avatar"),
  uploadProfileMultiple
);

router.get("/posts", auth, getPostsByPagination);
router.get("/posts/infinite", auth, getInfinitePostsByPagination);
router.get("/posts/:id", auth, getPost);
export default router;
