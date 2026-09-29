import { RequestHandler } from "express";

/** Forwards rejected promises from async route handlers to the error middleware. */
export const asyncHandler =
  (handler: RequestHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
