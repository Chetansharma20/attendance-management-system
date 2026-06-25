import { Request, Response, NextFunction, ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Handle Mongoose Validation Errors
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors || {})
      .map((val: any) => val.message)
      .join(", ");
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: err.errors ? Object.keys(err.errors) : [],
  });
};
