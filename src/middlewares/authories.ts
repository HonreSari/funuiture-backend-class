import { Request, Response, NextFunction } from "express";
import { getUserById } from "../services/authService";
import { errorCode } from "../../config/errorCode";
import { responseError } from "../utils/error";
interface CustomRequest extends Request {
  userId?: number;
  user?: any;
}
// authoirse(true, "ADMIN","Author")
// authorise(false, "User")
export const authorise = (permission: boolean, ...roles: string[]) => {
  return async (req: CustomRequest, res: Response, next: NextFunction) => {
    const userId = req.userId!;
    const user = await getUserById(userId!);
    if (!user) {
      return next(responseError("This account has not registered", 401, errorCode.unauthenticated));
    }
    const result = roles.includes(user.role);
    //           permission  && result
    // authoirse(true, "ADMIN","Author")
    if (permission && !result) {
      return next(responseError("This action is not allow", 403, errorCode.unauthorised));
    }
    if (!permission && result) {
      return next(responseError("This action is not allow", 403, errorCode.unauthorised));
    }
    req.user = user;
    next();
  };
};
