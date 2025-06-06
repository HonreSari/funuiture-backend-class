import { Request, Response, NextFunction } from "express";
import { body, query, validationResult } from "express-validator";
import path from "path";
import { unlink } from "node:fs/promises";
import { errorCode } from "../../../config/errorCode";
import { checkUserIfNotExit } from "../../utils/auth";
import { checkModelIfExit, checkUploadFile } from "../../utils/check";
import { responseError } from "../../utils/error";
import { getUserById } from "../../services/authService";
import ImageQueue from "../../jobs/queues/imageQueue";
import { createOneProduct, getProductById, UpdateOneProduct } from "../../services/productService";
import cacheQueue from "../../jobs/queues/cacheQueus";
import { descriptions } from "jest-config";
import { existsSync } from "node:fs";

interface CustomRequest extends Request {
  userId?: number;
  user?: any;
  files?: any;
}

const removeFiles = async (
  originalFiles: string[],
  optimizedFiles: string[] | null
) => {
  try {
    for (const originalFile of originalFiles) {
      const originalFilePath = path.join(
        __dirname,
        "../../..",
        "uploads",
        "images",
        originalFile
      );
      console.log("Attempting to delete:", originalFilePath);
      if (existsSync(originalFilePath)) {
        await unlink(originalFilePath);
      } else {
        console.log("file doesn't exit", originalFile);
      }
    }

    if (optimizedFiles) {
      for (const optimizedFile of optimizedFiles) {
        const optimizedFilePath = path.join(
          __dirname,
          "../../..",
          "uploads",
          "optimize",
          optimizedFile
        );
        console.log("Deleting file:", optimizedFilePath);
        if (existsSync(optimizedFilePath)) {
          await unlink(optimizedFilePath);
        } else {
          console.log("file doesn't exist", optimizedFile);
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
};

export const createProduct = [
  body("name", "Name is required").trim().notEmpty().escape(),
  body("description", "Desc is required").trim().notEmpty().escape(),
  body("price", "Price is required")
    .isFloat({ min: 0.1 })
    .isDecimal({ decimal_digits: "1,2" }),
  body("discount", "Price is required")
    .isFloat({ min: 0 })
    .isDecimal({ decimal_digits: "1,2" }),
  body("inventory", "Inventory is required").isInt({ min: 1 }),
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
      if (req.files && req.files.length > 0) {
        const originalFiles = req.files.map((file: any) => file.filename);
        await removeFiles(originalFiles, null);
      }
      return next(responseError(errors[0].msg, 400, errorCode.invalid));
    }
    const {
      name,
      description,
      price,
      discount,
      inventory,
      category,
      tags,
      type,
    } = req.body;
    checkUploadFile(req.files && req.files.length > 0);
    await Promise.all(
      req.files.map(async (file: any) => {
        const splitFileName = file.filename.split(".")[0];
        return ImageQueue.add(
          "optimize-image",
          {
            filePath: file.path,
            fileName: `${splitFileName}.webp`,
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
      })
    );
    const originalFileNames = req.files.map((file: any) => ({
      path: file.filename,
    }));
    const data: any = {
      name,
      description,
      price,
      discount,
      inventory: +inventory,
      category,
      type,
      tags,
      images: originalFileNames,
    };
    const product = await createOneProduct(data);
    await cacheQueue.add(
      "invalidate-post-cache",
      {
        pattern: "products:*",
      },
      {
        jobId: `invalidate-${Date.now()}`,
        priority: 1,
      }
    );

    res.status(200).json({
      message: "Successfully created in new post",
      productId: product.id,
    });
  },
];

export const updateProduct = [
  body("productId", "Product Id is required").isInt({ min: 1 }),
  body("name", "Name is required").trim().notEmpty().escape(),
  body("description", "Desc is required").trim().notEmpty().escape(),
  body("price", "Price is required")
    .isFloat({ min: 0.1 })
    .isDecimal({ decimal_digits: "1,2" }),
  body("discount", "Price is required")
    .isFloat({ min: 0 })
    .isDecimal({ decimal_digits: "1,2" }),
  body("inventory", "Inventory is required").isInt({ min: 1 }),
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
      if (req.files && req.files.length > 0) {
        const originalFiles = req.files.map((file: any) => file.filename);
        await removeFiles(originalFiles, null);
      }
      return next(responseError(errors[0].msg, 400, errorCode.invalid));
    }
        const {
      productId,
      name,
      description,
      price,
      discount,
      inventory,
      category,
      tags,
      type,
    } = req.body;

    const product = await getProductById(+productId);
    if (!product) {
      if( req.files  && req.files.length > 0){
        const originalFiles = req.files.map((file: any) => file.filename);
        await removeFiles(originalFiles, null);
      }
      return next(responseError("This data model doesn't not exit", 409 , errorCode.invalid));
    }

    let originalFileNames = [];
    if(req.files && req.files.length > 0) {
      originalFileNames = req.files.map(( file : any) => ( {
        path : file.filename,
      }))
    }

    const data : any = {
      name,
      description,
      price,
      discount,
      inventory : +inventory,
      category,
      tags,
      type,
      images : originalFileNames
    }

    if( req.files && req.files.length > 0) {
          await Promise.all(
      req.files.map(async (file: any) => {
        const splitFileName = file.filename.split(".")[0];
        return ImageQueue.add(
          "optimize-image",
          {
            filePath: file.path,
            fileName: `${splitFileName}.webp`,
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
      })
    );
     // * Deleting Old images
    const OrgFiles = product.images.map( (img) => img.path);
    const OtpFiles = product.images.map( (img) => img.path.split(".")[0]+".webp");
    await removeFiles(OrgFiles, OtpFiles);
    }
    const productUpdated = await UpdateOneProduct(product.id , data)
      await cacheQueue.add(
      "invalidate-post-cache",
      {
        pattern: "products:*",
      },
      {
        jobId: `invalidate-${Date.now()}`,
        priority: 1,
      }
    );

    res.status(200).json({ message: "Product Update is successfully", productId : productUpdated.id})
  },
];
