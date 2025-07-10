import { Request, Response, NextFunction } from "express";
import { query, param, validationResult } from "express-validator";
import { errorCode } from "../../../config/errorCode";
import { checkUserIfNotExit } from "../../utils/auth";
import { checkModelIfExit } from "../../utils/check";
import { responseError } from "../../utils/error";
import { getUserById } from "../../services/authService";
import {
  getProductList,
  getProductWithRelations,
} from "../../services/productService";
import { getOrSetCache } from "../../utils/cache";

interface CustomRequest extends Request {
  userId?: number;
}

export const getProduct = [
  param("id", "Product Id is required").isInt({ gt: 0 }),
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    // if validation error occurs
    if (errors.length > 0) {
      return next(responseError(errors[0].msg, 400, errorCode.invalid));
    }
    const productId = req.params.id;
    const userId = req.userId;
    const user = await getUserById(userId!);
    checkUserIfNotExit(user);

    // const post = await getPostWithRelations(+postId);
    const cacheKey = `product:${JSON.stringify(productId)}`;
    const product = await getOrSetCache(cacheKey, async () => {
      return await getProductWithRelations(+productId);
    });

    checkModelIfExit(product);

    res.status(200).json({ message: "OK", product });
  },
];

export const getProductByPagination = [
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
    const category = req.query.category;
    const type = req.query.type;
    const userId = req.userId;
    const user = await getUserById(userId!);
    checkUserIfNotExit(user);

    let categories: number[] = [];
    let types: number[] = [];

    if (category) {
      categories = category
        .toString()
        .split(",")
        .map((c) => Number(c))
        .filter((c) => c > 0);
    }
    if (type) {
      types = type
        .toString()
        .split(",")
        .map((c) => Number(c))
        .filter((c) => c > 0);
    }

    const where = {
      //?filter
      AND: [
        categories.length > 0 ? { categoryId: { in: categories } } : {},
        types.length > 0 ? { typeId: { in: categories } } : {},
      ],
    };

    const options = {
      where,
      take: +limit + 1,
      skip: lastCursor ? 1 : 0,
      cursor: lastCursor ? { id: +lastCursor } : undefined,
      select: {
        id: true,
        name: true,
        price: true,
        discount: true,
        status: true,
        images: {
          select: {
            id: true,
            path: true,
          },
          take: 1, //?   limit to the first image
        },
      },
      orderBy: {
        id: "desc",
      },
    };
    // const posts = await getPostList(options);
    const cacheKey = `products:${JSON.stringify(req.query)}`;
    const products = await getOrSetCache(cacheKey, async () => {
      return await getProductList(options);
    });

    const hasNextPage = products.length > +limit;

    if (hasNextPage) {
      products.pop();
    }

    const newCursor =
      products.length > 0 ? products[products.length - 1].id : null;

    res.status(200).json({
      message: "Get All infinite products",
      hasNextPage,
      newCursor,
      products,
    });
  },
];
