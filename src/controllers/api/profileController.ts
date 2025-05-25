import { Request, Response, NextFunction } from "express";
import { body, query, validationResult } from "express-validator";
import { unlink } from "node:fs/promises";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { errorCode } from "../../../config/errorCode";
import { authorise } from "../../utils/authorise";
import { getUserById, updateUser } from "../../services/authService";
import { checkUserIfNotExit } from "../../utils/auth";
import { responseError } from "../../utils/error";
import { checkUploadFile } from "../../utils/check";
import ImageQueue from "../../jobs/queues/imageQueue";

interface CustomRequest extends Request {
  userId?: number;
}

export const changeLanguage = [
  query("lng", "Invalid Language code.")
    .trim()
    .notEmpty()
    .matches("^[a-z]+$")
    .isLength({ min: 2, max: 3 }),
  (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    // If validation error occurs
    if (errors.length > 0) {
      return next(responseError(errors[0].msg, 400, errorCode.invalid));
    }

    const { lng } = req.query;
    res.cookie("i18next", lng);
    res.status(200).json({ message: req.t("changeLan", { lang: lng }) });
  },
];

export const testPermission = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.userId;
  const user = await getUserById(userId!);
  checkUserIfNotExit(user);
  const info: any = {
    title: " Testing Permission ",
  };
  // if user.role = "AUTHOR"
  //  content = "Your are the author"
  const can = authorise(true, user!.role, "AUTHOR");
  if (can) {
    info.content = "You have permission to read this line.";
  }
  res.status(200).json({ message: "" });
};
// export const changeLanguage = (req : CustomRequest, res : Response , next : NextFunction) => {
//   res.status(200).json({ message : "This shit is crazy"})
// }

export const uploadProfile = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const userID = req.userId;
  const image = req.file;
  const user = await getUserById(userID!);
  checkUserIfNotExit(user);
  checkUploadFile(image);
  //  console.log(image);
  const filename = image?.filename;
  // const filePath = image.path.replace("\\","/")
  if (user?.image) {
    try {
      const filePath = path.join(
        __dirname,
        "../../..",
        "/uploads/images",
        user.image!
      );
      await unlink(filePath);
    } catch (error) {
      console.error("Error deleting old image:", error);
    }
  }
  const userData = {
    image: filename,
  };
  await updateUser(user?.id!, userData);
  res.status(200).json({
    message: "Profile picture uploaded successfully.",
    filename: req.file?.filename,
    path: req.file?.path,
  });
};

export const uploadProfileMultiple = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  res
    .status(200)
    .json({ message: " Multiple Profile picture uploaded successfully." });
};

export const uploadProfileOptimize = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.userId;
  const image = req.file;
  const user = await getUserById(userId!);
  checkUserIfNotExit(user);
  checkUploadFile(image);

  const splitFileName = req.file?.filename.split(".")[0];

  const job = await ImageQueue.add(
    "optimize-image",
    {
      filePath: req.file?.path,
      fileName: `${splitFileName}.webp`,
      width: 200,
      height: 200,
      quality: 50,
    },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
    }
  );

  // try {
  //   const optimizedImagePath = path.join(
  //     __dirname,
  //     "../../..",
  //     "/uploads/images",
  //     fileName
  //   );
  //   await sharp(req.file?.buffer)
  //     .resize(200, 200)
  //     .webp({ quality: 50 })
  //     .toFile(optimizedImagePath);
  // } catch (error) {
  //   console.error(error);
  //   res.status(500).json({ message: "Image optimization failed." });
  //   return;
  // }

  if (user?.image) {
    try {
      const originalFilePath = path.join(
        __dirname,
        "../../..",
        "/uploads/images",
        user!.image!
      );
      const optimizedFilePath = path.join(
        __dirname,
        "../../..",
        "/uploads/optimize",
        user!.image!.split(".")[0] + ".webp"
      );

      await unlink(originalFilePath);
      await unlink(optimizedFilePath);
    } catch (error) {
      console.log(error);
    }
  }

  const userData = {
    image: req.file?.filename,
  };
  await updateUser(user?.id!, userData);

  res.status(200).json({
    message: "Profile picture uploaded successfully.",
    image: splitFileName + ".webp",
    jobId: job.id,
  });
};
