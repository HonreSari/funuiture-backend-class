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
import {
  createOnePost,
  deleteOnePost,
  getPostById,
  PostArgs,
  updateOnePost,
} from "../../services/postService";
import cacheQueue from "../../jobs/queues/cacheQueus";

interface CustomRequest extends Request {
    userId? : number;
    user? : any;
}