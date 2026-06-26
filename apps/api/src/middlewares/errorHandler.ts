import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import { logger } from "../config/logger";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = "Internal Server Error";
  let errors: any = undefined;

  // Log error
  logger.error(`${req.method} ${req.path} - Error: ${err.message}`);
  if (process.env.NODE_ENV === "development" && err.stack) {
    logger.debug(err.stack);
  }

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === "ValidationError" || err.name === "ZodError") {
    statusCode = 400;
    message = "Validation Failed";
    errors = err.errors || err.issues;
  } else if (err.code === "P2002") {
    // Prisma unique constraint violation
    statusCode = 409;
    message = "Unique constraint violation: resource already exists";
  } else if (err.code === "P2025") {
    // Prisma record not found
    statusCode = 404;
    message = "Record not found";
  }

  res.status(statusCode).json({
    status: "error",
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
