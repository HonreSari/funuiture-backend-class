import { Request, Response, NextFunction } from "express";
import { title } from "process";

export const home = (req: Request, res: Response, next: NextFunction) => {
  res.render("index", { title: "Home Page" });
};

export const about = (req: Request, res: Response, next: NextFunction) => {
  const users = [
    { name: "John", age: 30 }
  ];
  res.render("about", { title: "About us", users });
};
