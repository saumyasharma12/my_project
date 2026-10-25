import { z } from "zod";

export const registerBodySchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
});
