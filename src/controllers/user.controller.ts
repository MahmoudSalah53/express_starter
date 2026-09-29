import { RequestHandler } from "express";
import { userService } from "../services/user.service";
import { CreateUserInput } from "../validators/user.validator";

export const listUsers: RequestHandler = async (_req, res) => {
  const users = await userService.list();
  res.json({ status: "success", data: users });
};

export const getUser: RequestHandler = async (req, res) => {
  const user = await userService.getById(req.params.id);
  res.json({ status: "success", data: user });
};

export const createUser: RequestHandler = async (req, res) => {
  const user = await userService.create(req.body as CreateUserInput);
  res.status(201).json({ status: "success", data: user });
};
