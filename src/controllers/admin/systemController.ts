import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { responseError } from "../../utils/error";
import { errorCode } from "../../../config/errorCode";
import { createOrUpdateSettingStatus } from "../../services/settingsService";
interface CustomRequest extends Request {
  user?: any;
  // t?: (key: string) => string;
}
export const setMaintenance = [
  body("mode", "mode must be boolean").isBoolean(),
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    // if validation error occurs
    if (errors.length > 0) {
      return next(responseError(errors[0].msg, 400, errorCode.invalid));
    }
    //const user = req.user;
    const { mode } = req.body;
    const value = mode ? "true" : "false";
    const message = mode ? "Maintenance mode is on" : "Maintenance mode is off";
    await createOrUpdateSettingStatus("maintenance", value);
    res.status(200).json({ message });
  },
];
