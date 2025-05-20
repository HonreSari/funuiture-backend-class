import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { errorCode } from "../../config/errorCode";
import { getUserById, updateUser } from "../services/authService";
import { responseError } from "../utils/error";
interface CustomRequest extends Request {
  userId?: number;
}

export const auth = (req: CustomRequest, res: Response, next: NextFunction) => {
  const accessToken = req.cookies ? req.cookies.accessToken : null;
  const refreshToken = req.cookies ? req.cookies.refreshToken : null;

  if (!refreshToken) {
    return responseError("You are't an authenticated user", 401, errorCode.unauthenticated);
  }

  const generateNewToken = async () => {
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as {
        id: number;
        phone: string;
      };
    } catch (err) {
      return next(responseError("You are't an authenticated user", 401, errorCode.unauthenticated))
    }
    if (isNaN(decoded.id)) {
      return next(responseError("You are't an authenticated user.", 401, errorCode.unauthenticated));
    }
    const user = await getUserById(decoded.id);
    if (!user) {
      return next(responseError("This account has not registered!", 401, errorCode.unauthenticated));
    }
    // check user input phone and in the cookie phone
    if (user.phone !== decoded.phone) {
      return next(responseError("You are not authenticated user!", 401, errorCode.unauthenticated));
    }

    if (user.randomToken !== refreshToken) {
      return next(responseError("You are not authenticated User!", 401, errorCode.unauthenticated));
    }
    const accessTokenPayload = { id: user.id };
    const refreshTokenPayload = { id: user.id, phone: user.phone };
    const newAccessToken = jwt.sign(
      accessTokenPayload,
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: 60 * 10 }
    );
    const newRefreshToken = jwt.sign(
      refreshTokenPayload,
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: "30d" }
    );

    const userUpdateData = {
      randomToken: newRefreshToken,
    };
    await updateUser(user.id, userUpdateData);
    res
      .cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 15 * 60 * 1000, // 15miutes
        path: "/",
      })
      .cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: "/",
      });
    req.userId = user!.id;
    next();
  };

  if (!accessToken) {
    generateNewToken();
    // const err: any = new Error("Access token had expired");
    // err.status = 401;
    // err.code = errorCode.accessTokenExpired;
    // return next(err);
  } else {
    //Verify access Token
    let decoded;
    try {
      decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET!) as {
        id: number;
      };
      req.userId = decoded.id;
      if (isNaN(decoded.id)) {
        return next(responseError("You are't an authenticated user", 401, errorCode.unauthenticated));
      }
      next();
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        return next(responseError("Access Token had expired", 401, errorCode.accessTokenExpired))
      } else {
        return next(responseError("Access Token is invalid", 400, errorCode.attack))
      }
    }
  }
};
