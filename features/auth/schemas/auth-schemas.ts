import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(1),
    email: z.string().trim().email(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contrasenas no coinciden",
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

