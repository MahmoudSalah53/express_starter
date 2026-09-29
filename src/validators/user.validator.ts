import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(1).max(100),
});

export const userIdParamSchema = z.object({
  id: z.string().cuid(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
