import { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { AppError } from "../utils/AppError";

function isBodyParserError(err: unknown, type: string): boolean {
  return typeof err === "object" && err !== null && "type" in err && err.type === type;
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (isBodyParserError(err, "entity.parse.failed")) {
    res.status(400).json({
      status: "error",
      message: "Invalid JSON body",
    });
    return;
  }

  if (isBodyParserError(err, "entity.too.large")) {
    res.status(413).json({
      status: "error",
      message: "Request body is too large",
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      status: "error",
      message: "Validation failed",
      errors: err.flatten().fieldErrors,
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    res.status(409).json({
      status: "error",
      message: "A record with this value already exists",
    });
    return;
  }

  const statusCode = err instanceof AppError ? err.statusCode : 500;

  if (statusCode >= 500) {
    logger.error({ err, method: req.method, path: req.originalUrl }, "Request failed");
  }

  res.status(statusCode).json({
    status: "error",
    message: statusCode >= 500 ? "Internal server error" : err.message,
    ...(env.NODE_ENV === "development" && statusCode >= 500 ? { stack: err.stack } : {}),
  });
};
