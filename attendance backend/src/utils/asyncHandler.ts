import { Request, Response, NextFunction, RequestHandler } from "express";

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => any): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => next(error));
  };
};

export { asyncHandler };
