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
import { getProduct, getProductByPagination } from "../../../controllers/api/productController";
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

router.get("/posts", auth, getPostsByPagination);  // offset Pagination
router.get("/posts/infinite", auth, getInfinitePostsByPagination); // Cursor-based Pagination
router.get("/posts/:id", auth, getPost);


router.get("/products", auth, getProductByPagination);  // ? Cursor-based pagination
router.get("/products/:id", auth, getProduct);

export default router;
