import { Request, Response, NextFunction } from "express";
import { body, query, validationResult } from "express-validator";
import sanitizeHtml from "sanitize-html";
import path from "path";
import { unlink } from "node:fs/promises";
import { errorCode } from "../../../config/errorCode";
import { checkUserIfNotExit } from "../../utils/auth";
import { checkModelIfExit, checkUploadFile } from "../../utils/check";
import { responseError } from "../../utils/error";
import { getUserById } from "../../services/authService";
import ImageQueue from "../../jobs/queues/imageQueue";
import {
  createOnePost,
  deleteOnePost,
  getPostById,
  PostArgs,
  updateOnePost,
} from "../../services/postService";
import { use } from "i18next";
import { Prisma } from "@prisma/client";
import cacheQueue from "../../jobs/queues/cacheQueus";

interface CustomRequest extends Request {
  userId?: number;
  user?: any;
}

const removeFile = async (
  originalFile: string,
  optimizedFile: string | null
) => {
  try {
    const originalFilePath = path.join(
      __dirname,
      "../../..",
      "uploads",
      "images",
      originalFile
    );

    await unlink(originalFilePath);

    if (optimizedFile) {
      const optimizedFilePath = path.join(
        __dirname,
        "../../..",
        "uploads",
        "optimize",
        optimizedFile
      );
      console.log("Deleting file:", optimizedFilePath);
      await unlink(optimizedFilePath);
    }
  } catch (error) {
    console.log(error);
  }
};

export const createPost = [
  body("title", "Title is required").trim().notEmpty().escape(),
  body("content", "Content is required").trim().notEmpty().escape(),
  body("body", "Body is required")
    .trim()
    .notEmpty()
    .customSanitizer((value) => sanitizeHtml(value))
    .notEmpty(),
  body("category", "Category is required").trim().notEmpty().escape(),
  body("type", "Type is required").trim().notEmpty().escape(),
  body("tags", "Tag is Invalid")
    .trim()
    .optional({ nullable: true })
    .customSanitizer((value) => {
      if (value) {
        return value
          .split(",")
          .map((tag: string) => tag.trim())
          .filter((tag: string) => tag !== "");
      }
      return value;
    }),
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    //* if validation error occurs
    if (errors.length > 0) {
      if (req.file) {
        await removeFile(req.file.filename, null);
      }
      return next(responseError(errors[0].msg, 400, errorCode.invalid));
    }
    const { title, content, body, category, tags, type } = req.body;
    // const userID = req.userId;
    const user = req.user;
    checkUploadFile(req.file);
    // const user = await getUserById(userID!);
    /*
    if (!user) {
      return next(
        responseError(
          "This user is not authenticated",
          401,
          errorCode.unauthenticated
        )
      );
    }
*/
    const splitFileName = req.file?.fieldname.split(".")[0];
    await ImageQueue.add(
      "optimize-image",
      {
        filePath: req.file?.path,
        fileName: `${splitFileName}.we bp`,
        width: 835,
        height: 577,
        quality: 100,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
      }
    );
    const data: PostArgs = {
      title,
      content,
      body,
      image: req.file!.filename,
      authorId: user!.id,
      category,
      type,
      tags,
    };
    const post = await createOnePost(data);
    await cacheQueue.add(
      "invalidate-post-cache",
      {
        pattern: "posts:*",
      },
      {
        jobId: `invalidate-${Date.now()}`,
        priority: 1,
      }
    );

    res
      .status(200)
      .json({ message: "Successfully created in new post", postId: post.id });
  },
];

export const updatePost = [
  body("postId", "postId is required").trim().notEmpty().isInt({ min: 1 }),
  body("title", "Title is required").trim().notEmpty().escape(),
  body("content", "Content is required").trim().notEmpty().escape(),
  body("body", "Body is required")
    .trim()
    .notEmpty()
    .customSanitizer((value) => sanitizeHtml(value))
    .notEmpty(),
  body("category", "Category is required").trim().notEmpty().escape(),
  body("type", "Type is required").trim().notEmpty().escape(),
  body("tags", "Tag is Invalid")
    .trim()
    .optional({ nullable: true })
    .customSanitizer((value) => {
      if (value) {
        return value
          .split(",")
          .map((tag: string) => tag.trim())
          .filter((tag: string) => tag !== "");
      }
      return value;
    }),
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    // if validation error occurs
    if (errors.length > 0) {
      if (req.file) {
        await removeFile(req.file.filename, null);
      }
      return next(responseError(errors[0].msg, 400, errorCode.invalid));
    }
    const { postId, title, content, body, category, tags, type } = req.body;
    // const userID = req.userId;
    const user = req.user;
    // checkUploadFile(req.file);
    // const user = await getUserById(userID!);
    // if (!user) {
    //   return next(
    //     responseError(
    //       "This user is not authenticated",
    //       401,
    //       errorCode.unauthenticated
    //     )
    //   );
    // }

    const post = await getPostById(+postId); // ! + is use to convert string to number
    if (!post) {
      if (req.file) {
        await removeFile(req.file.filename, null);
      }

      return next(
        responseError("That data model doesn't exist", 404, errorCode.invalid)
      );
    }
    if (user.id !== post.authorId) {
      if (req.file) {
        await removeFile(req.file.filename, null);
      }

      return next(
        responseError("That action is not allowed ", 404, errorCode.invalid)
      );
    }
    const data: any = {
      title,
      content,
      body,
      image: req.file,
      category,
      type,
      tags,
    };
    if (req.file) {
      data.image = req.file.filename;
      const splitFileName = req.file?.fieldname.split(".")[0];
      await ImageQueue.add(
        "optimize-image",
        {
          filePath: req.file?.path,
          fileName: `${splitFileName}.webp`,
          width: 835,
          height: 577,
          quality: 80,
        },
        {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
        }
      );
      const optimizeFile = post.image.split(".")[0] + ".webp";
      await removeFile(post.image, optimizeFile);
    }
    const postUpdated = await updateOnePost(post.id, data);
    await cacheQueue.add(
      "invalidate-post-cache",
      {
        pattern: "posts:*",
      },
      {
        jobId: `invalidate-${Date.now()}`,
        priority: 1,
      }
    );
    res
      .status(200)
      .json({ message: "Successfully updated post", postId: postUpdated.id });
  },
];

export const deletePost = [
  body("postId", "postId is required").isInt({ gt: 0 }),

  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    // if validation error occurs
    if (errors.length > 0) {
      return next(responseError(errors[0].msg, 400, errorCode.invalid));
    }
    const { postId } = req.body;
    // const userId = req.userId;
    // const user = await getUserById(userId!);
    const user = req.user;
    // checkUserIfNotExit(user);
    const post = await getPostById(+postId); //? + is used to convert string to number
    checkModelIfExit(post);
    if (user!.id !== post!.authorId) {
      return next(
        responseError(
          "That action is not allowed ",
          403,
          errorCode.unauthorised
        )
      );
    }

    const postDeleted = await deleteOnePost(post!.id);
    const optimizeFile = post!.image.split(".")[0] + ".webp";
    await removeFile(post!.image, optimizeFile);

    await cacheQueue.add(
      "invalidate-post-cache",
      {
        pattern: "posts:*",
      },
      {
        jobId: `invalidate-${Date.now()}`,
        priority: 1,
      }
    );
    res.status(200).json({
      message: "Successfully deleted the post",
      postId: postDeleted.id,
    });
  },
];
