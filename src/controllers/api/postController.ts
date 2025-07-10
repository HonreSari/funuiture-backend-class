import { Request, Response, NextFunction } from "express";
import { body, query, param, validationResult } from "express-validator";
import { errorCode } from "../../../config/errorCode";
import { checkUserExited, checkUserIfNotExit } from "../../utils/auth";
import { checkModelIfExit, checkUploadFile } from "../../utils/check";
import { responseError } from "../../utils/error";
import { getUserById } from "../../services/authService";
import {
  getPostById,
  getPostList,
  getPostWithRelations,
} from "../../services/postService";
import { getOrSetCache } from "../../utils/cache";
import { title } from "node:process";
import { skip } from "node:test";

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

    // const post = await getPostWithRelations(+postId);
    const cacheKey = `posts:${JSON.stringify(postId)}`;
    const post = await getOrSetCache(cacheKey, async () => {
      return await getPostWithRelations(+postId);
    });
    checkModelIfExit(post);
    /*
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
      tags:
        post?.tags && post?.tags.length > 0
          ? post.tags.map((i) => i.name)
          : null,
    };
*/

    res.status(200).json({ message: "OK", post });
  },
];

//offset pagination
export const getPostsByPagination = [
  query("page", "Page number must be unsigned integer.")
    .isInt({ gt: 0 })
    .optional(),
  query("limit", "Limit number must be unsigned interger")
    .isInt({ gt: 4 })
    .optional(),
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    // if validation error occurs
    if (errors.length > 0) {
      return next(responseError(errors[0].msg, 400, errorCode.invalid));
    }
    const page = req.query.page || 1;
    const limit = req.query.limit || 5;
    const userId = req.userId;
    const user = await getUserById(userId!);
    checkUserIfNotExit(user);

    const skip = (+page - 1) * +limit;
    const options = {
      skip,
      take: +limit + 1,
      select: {
        id: true,
        title: true,
        content: true,
        image: true,
        updatedAt: true,
        author: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    };
    const cacheKey = `posts:${JSON.stringify(req.query)}`;
    const posts = await getOrSetCache(cacheKey, async () => {
      return await getPostList(options);
    });
    const hasNextPage = posts.length > +limit;
    let nextPage = null;
    const previousPage = +page !== 1 ? +page - 1 : null;
    if (hasNextPage) {
      posts.pop();
      nextPage = +page + 1;
    }

    res.status(200).json({
      message: "Get All Posts",
      currentPage: page,
      posts,
      previousPage,
      hasNextPage,
      nextPage,
    });
  },
];

//Cusor Pagination
export const getInfinitePostsByPagination = [
  query("Cursor", "Cursor must be postId.").isInt({ gt: 0 }).optional(),
  query("limit", "Limit number must be unsigned interger")
    .isInt({ gt: 4 })
    .optional(),
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    // if validation error occurs
    if (errors.length > 0) {
      return next(responseError(errors[0].msg, 400, errorCode.invalid));
    }
    // !to have authenticated user
    const lastCursor = req.params.cursor;
    const limit = req.query.limit || 5;
    const userId = req.userId;
    const user = await getUserById(userId!);
    checkUserIfNotExit(user);

    const options = {
      take: +limit + 1,
      skip: lastCursor ? 1 : 0,
      cursor: lastCursor ? { id: +lastCursor } : undefined,
      select: {
        id: true,
        title: true,
        content: true,
        image: true,
        updatedAt: true,
        author: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    };
    // const posts = await getPostList(options);
    const cacheKey = `posts:${JSON.stringify(req.query)}`;
    const posts = await getOrSetCache(cacheKey, async () => {
      return await getPostList(options);
    });

    const hasNextPage = posts.length > +limit;

    if (hasNextPage) {
      posts.pop();
    }

    const newCursor = posts.length > 0 ? posts[posts.length - 1].id : null;

    res.status(200).json({
      message: "Get All infinite posts",
      hasNextPage,
      newCursor,
      posts,
    });
  },
];
