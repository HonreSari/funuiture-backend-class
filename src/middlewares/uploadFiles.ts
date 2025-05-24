import { Request } from "express";
import multer, { FileFilterCallback } from "multer";

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/images");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: fileStorage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB
});


export const uploadMemory = multer({ 
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize : 1024 * 1024 * 10} , //Maximum file size is 10MB
});

export default upload;