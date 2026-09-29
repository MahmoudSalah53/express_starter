import { Router } from "express";
import { createUser, getUser, listUsers } from "../controllers/user.controller";
import { validate } from "../middlewares/validate.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { createUserSchema, userIdParamSchema } from "../validators/user.validator";

export const userRouter = Router();

userRouter.get("/", asyncHandler(listUsers));
userRouter.get("/:id", validate({ params: userIdParamSchema }), asyncHandler(getUser));
userRouter.post("/", validate({ body: createUserSchema }), asyncHandler(createUser));
