import { z } from "zod";

export const signInSchema = z.object(
  {
    mode: z.literal("sign-in"),
    email: z.email(),
    password: z.string().min(5),
  },
);

export const signUpSchema = z.object(
  {
    mode: z.literal("sign-up"),
    name: z.string().min(3).max(30),
    email: z.email(),
    password: z.string().min(5),
  },
);
