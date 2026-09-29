import { RequestHandler } from "express";
import { ZodTypeAny } from "zod";

type RequestSchemas = {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
};

/** Parses and replaces req.body, req.query, or req.params. Zod errors reach the error handler. */
export const validate =
  (schemas: RequestSchemas): RequestHandler =>
  (req, _res, next) => {
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }

    if (schemas.query) {
      req.query = schemas.query.parse(req.query);
    }

    if (schemas.params) {
      req.params = schemas.params.parse(req.params);
    }

    next();
  };
