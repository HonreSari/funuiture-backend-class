import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import moment from "moment";
import {
  createOtp,
  getOtpByPhone,
  getUserByPhone,
  updateOtp,
} from "../services/authServices";
import {
  checkOtpErrorIfSameDate,
  checkOtpRow,
  checkUserExited,
} from "../utils/auth";
import { generateOTP, generateToken } from "../utils/generate";
import bcrypt from "bcrypt";
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
export const confirmPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(200).json({ message: "user register is successfully" });
};
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(200).json({ message: "user register is successfully" });
};
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(200).json({ message: "user register is successfully" });
};
