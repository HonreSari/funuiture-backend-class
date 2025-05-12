import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import moment from "moment";
import jwt from "jsonwebtoken";
import {
  createOtp,
  createUser,
  getOtpByPhone,
  getUserByPhone,
  updateOtp,
  updateUser,
} from "../services/authService";
import {
  checkOtpErrorIfSameDate,
  checkOtpRow,
  checkUserExited,
  checkUserIfNotExit,
} from "../utils/auth";
import { generateOTP, generateToken } from "../utils/generate";
import bcrypt, { getRounds } from "bcrypt";
import { resolve } from "path";
import { Status } from "../../generated/prisma";
export const register = [
  body("phone", "Invalid phone number")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 5, max: 12 }),
  async (req: Request, res: Response, next: NextFunction) => {
    console.log(req.body);
    const errors = validationResult(req).array({ onlyFirstError: true });
    // if validation error occurs
    if (errors.length > 0) {
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = "Error_Invalid";
      return next(error);
    }
    let phone = req.body.phone;
    if (phone.slice(0, 2) === "09") {
      phone = phone.substring(2, phone.length);
    }
    const user = await getUserByPhone(phone);
    checkUserExited(user);
    // OTP sending logic here
    // Generate OTP & calling OTP sending API
    //if sms OTP cannot be sent ,response error
    // Save OTP to DB
    const otp = 123456; // for testing
    // const otp = generateOTP(); //for production use
    const salt = await bcrypt.genSalt(10);
    const hashOtp = await bcrypt.hash(otp.toString(), salt);
    const token = generateToken();
    const otpRow = await getOtpByPhone(phone);
    let result;
    if (!otpRow) {
      const otpData = {
        phone,
        otp: hashOtp,
        rememberToken: token,
        count: 1,
      };
      result = await createOtp(otpData);
    } else {
      const lastOtpRequest = new Date(otpRow.updatedAt).toLocaleDateString();
      const today = new Date().toLocaleDateString();
      const isSameDate = lastOtpRequest === today;
      checkOtpErrorIfSameDate(isSameDate, otpRow.error);
      if (!isSameDate) {
        const otpData = {
          otp: hashOtp,
          rememberToken: token,
          count: 1,
          error: 0,
        };
        result = await updateOtp(otpRow.id, otpData);
      } else {
        // allows otp request 3 times per day
        if (otpRow.count === 3) {
          const error: any = new Error("otp is request for 3 times per day");
          error.status = 405;
          error.code = "Error_OverLimit";
          return next(error);
        } else {
          const otpData = {
            otp: hashOtp,
            rememberToken: token,
            count: {
              increment: 1,
            },
          };
          result = await updateOtp(otpRow.id, otpData);
        }
      }
    }

    res.status(200).json({
      message: `We are sending OTP to ${result.phone}`,
      phone: result.phone,
      token: result.rememberToken,
    });
  },
];
export const verifyOtp = [
  body("phone", "Invalid phone number")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 5, max: 12 }),
  body("otp", "Invalid OTP")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 6, max: 6 }),
  body("token", "Invalid token").trim().notEmpty().escape(),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    // if validation error occurs
    if (errors.length > 0) {
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = "Error_Invalid";
      return next(error);
    }
    const { phone, otp, token } = req.body;
    const user = await getUserByPhone(phone);
    checkUserExited(user);

    const otpRow = await getOtpByPhone(phone);
    checkOtpRow(otpRow);

    const lastOtpVerify = new Date(otpRow!.updatedAt).toLocaleDateString();
    const today = new Date().toLocaleDateString();
    const isSameData = lastOtpVerify === today;
    //IF OTP verify is in the same date and over limit
    checkOtpErrorIfSameDate(isSameData, otpRow!.error);
    //When token is wrong
    if (otpRow?.rememberToken !== token) {
      const otpData = {
        error: 5,
      };
      await updateOtp(otpRow!.id, otpData);
      const error: any = new Error("Invalid token");
      error.status = 400;
      error.code = "Error_Invalid";
      return next(error);
    }
    // OTP is expired
    const isExpired = moment().diff(otpRow!.updatedAt, "minutes") > 2;
    if (isExpired) {
      const error: any = new Error("OTP is expired");
      error.status = 403;
      error.code = "Error_Expired";
      return next(error);
    }
    const isMatchOtp = await bcrypt.compare(otp, otpRow!.otp);
    // when OTP is wrong
    if (!isMatchOtp) {
      // if the error is first times for today
      if (!isSameData) {
        const otpData = {
          error: 1,
        };
        await updateOtp(otpRow!.id, otpData);
      } else {
        //If OTP error is not for first times today
        const otpData = {
          error: { increment: 1 },
        };
        await updateOtp(otpRow!.id, otpData);
      }
      const error: any = new Error("OTP is incorrect");
      error.status = 400;
      error.code = "Error_Invalid";
      return next(error);
    }
    //everything is okay
    const verifyToken = generateToken();
    const otpData = {
      verifyToken,
      error: 0,
      count: 1,
    };
    const result = await updateOtp(otpRow!.id, otpData);
    res.status(200).json({
      message: "otp verify is successfully",
      phone: result.phone,
      token: result.verifyToken,
    });
  },
];
export const confirmPassword = [
  body("phone", "Invalid phone number")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 5, max: 12 }),
  body("password", "Password must be 8 digits")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 8, max: 8 }),
  body("token", "Invalid token").trim().notEmpty().escape(),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    // if validation error occurs
    if (errors.length > 0) {
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = "Error_Invalid";
      return next(error);
    }
    const { phone, password, token } = req.body;
    const user = await getUserByPhone(phone);
    checkUserExited(user);
    const otpRow = await getOtpByPhone(phone);
    checkOtpRow(otpRow);
    if (otpRow?.error === 5) {
      const error: any = new Error("This request had unavialble input");
      error.status = 400;
      error.code = "Error_OverLimit";
      return next(error);
    }
    if (otpRow?.verifyToken !== token) {
      const otpData = {
        error: 5,
      };
      await updateOtp(otpRow!.id, otpData);
      const error: any = new Error("Invalid token");
      error.status = 400;
      error.code = "Error_Invalid";
      return next(error);
    }
    //request is expired
    const isExpired = moment().diff(otpRow!.updatedAt, "minutes") > 10;
    if (isExpired) {
      const error: any = new Error("OTP is expired");
      error.status = 403;
      error.code = "Error_Expired";
      return next(error);
    }
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    const randomToken = "I will replace Refresh token soon.";

    const userData = {
      phone,
      password: hashPassword,
      randomToken,
    };

    const newUser = await createUser(userData);
    const accessTokenPayload = { id: newUser.id };
    const refreshTokenPayload = { id: newUser.id, phone: newUser.phone };
    const accessToken = jwt.sign(
      accessTokenPayload,
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: 60 * 15 }
    );
    const refreshToken = jwt.sign(
      refreshTokenPayload,
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: "30d" }
    );

    const userUpdateData = {
      randomToken: refreshToken,
    };
    await updateUser(newUser.id, userUpdateData);
    res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 15 * 60 * 1000, // 15miutes
        path: "/",
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: "/",
      })
      .status(201)
      .json({
        message: "acc created is successfully",
        userId: newUser.id,
      });
  },
];
export const login = [
  body("phone", "Invalid phone number")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 5, max: 12 }),
  body("password", "Password must be 8 digits")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 8, max: 8 }),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    // if validation error occurs
    if (errors.length > 0) {
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = "Error_Invalid";
      return next(error);
    }
    const password = req.body.password;
    let phone = req.body.phone;
    if (phone.slice(0, 2) == "09") {
      phone = phone.substring(2, phone.length);
    }
    const user = await getUserByPhone(phone);
    checkUserIfNotExit(user);
    // If wrong password was over limit
    if (user?.status === "FREEZE") {
      const error: any = new Error(
        "Your acc is tamporily bann, please contact us"
      );
      error.status = 401;
      error.code = "Error_Freeze";
      return next(error);
    }
    const isMatchPassword = await bcrypt.compare(password, user!.password);
    if (!isMatchPassword) {
      // Starting to record wrong times
      const lastRequest = new Date(user!.updatedAt).toLocaleDateString();
      const isSameDate = lastRequest == new Date().toLocaleDateString();
      // if today password is wrong for first time
      if (!isSameDate) {
        const userData = {
          errorLoginCount: 1,
        };
        await updateUser(user!.id, userData);
      } else {
        // Today password was wrong for two times
        if (user!.errorLoginCount >= 2) {
          const userData = {
            status: "FREEZE",
          };
          await updateUser(user!.id, userData);
        } else {
          const userData = {
            errorLoginCount: {
              increment: 1,
            },
          };
          await updateUser(user!.id, userData);
        }
      }
      const error: any = new Error("Password is wrong.");
      error.status = 401;
      error.code = "Error_Invalid";
      return next(error);
    }
    // Authorization token
    const accessTokenPayload = { id: user!.id };
    const refreshTokenPayload = { id: user!.id, phone: user!.phone };
    const accessToken = jwt.sign(
      accessTokenPayload,
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: 60 * 15 } // 15 min
    );
    const refreshToken = jwt.sign(
      refreshTokenPayload,
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: "30d" }
    );
    const userData = {
      errorLoginCount: 0, // reset error count if the user login is successful
      randomToken: refreshToken,
    };
    await updateUser(user!.id, userData);
    res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 15 * 60 * 1000, // 15miutes
        path: "/",
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: "/",
      })
      .status(200)
      .json({
        message: "Successfully logged In",
        userId: user!.id,
      });
  },
];

