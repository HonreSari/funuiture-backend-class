import { Request, Response, NextFunction } from "express";
import { body, query, param, validationResult } from "express-validator";
import { errorCode } from "../../../config/errorCode";
import { checkUserIfNotExit } from "../../utils/auth";
import { checkUploadFile } from "../../utils/check";
import { responseError } from "../../utils/error";
import { getUserById } from "../../services/authService";
import { getPostById, getPostWithRelations } from "../../services/postService";

interface CustomRequest extends Request {
  userId?: number;
}

export const getPost = [
  param("id", "Post Id is required").isInt({ gt: 0 }),
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    // if validation error occurs
    if (errors.length > 0) {
      return next(responseError(errors[0].msg, 400, errorCode.invalid));
    }
    const postId = req.params.id;
    const userId = req.userId;
    const user = await getUserById(userId!);
    checkUserIfNotExit(user);

    const post = await getPostWithRelations(+postId);

    const modifiedPost = {
      id: post!.id,
      title: post?.title,
      content: post?.content,
      body: post?.body,
      image: "/optimize" + post?.image.split(".")[0] + ".webp",
      updatedAt: post?.updatedAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      fullName: (post?.author.firstName ?? "") + " " + post?.author.lastName,
      category: post?.category.name,
      type: post?.type.name,
      tags: post?.tags,
    };

    res.status(200).json({ message: "OK", post });
  },
];

export const getPostsByPagination = [
  body("phone", "Invalid phone number")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 5, max: 12 }),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    // if validation error occurs
    if (errors.length > 0) {
      return next(responseError(errors[0].msg, 400, errorCode.invalid));
    }
    const { phone, password, token } = req.body;

    res.status(200).json({ message: "OK" });
  },
];

export const getInfinitePostsByPagination = [
  query("phone", "Invalid phone number")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 5, max: 12 }),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    // if validation error occurs
    if (errors.length > 0) {
      return next(responseError(errors[0].msg, 400, errorCode.invalid));
    }
    const { phone, password, token } = req.body;

    res.status(200).json({ message: "OK" });
  },
];
