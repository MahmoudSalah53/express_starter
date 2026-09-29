import { prisma } from "../config/database";
import { AppError } from "../utils/AppError";
import { CreateUserInput } from "../validators/user.validator";

export const userService = {
  list() {
    return prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  },

  create(input: CreateUserInput) {
    return prisma.user.create({ data: input });
  },
};
