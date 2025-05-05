import { Request, Response, NextFunction } from "express";
import { title } from "process";

export const get404 = (req: Request, res: Response, next: NextFunction) => {
  res.render("error", { title: "Home Page" , message: "Page Not Found"});
};
