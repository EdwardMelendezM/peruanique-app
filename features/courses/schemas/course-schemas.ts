import { z } from "zod";

const courseIdSchema = z.string().uuid("El identificador del curso no es válido");

const optionalColorSchema = z
  .union([z.string().trim().min(1).max(50), z.literal("")])
  .transform((value) => (value === "" ? null : value));

const optionalUrlSchema = z
  .union([z.string().trim().url("Ingresa una URL válida"), z.literal("")])
  .transform((value) => (value === "" ? null : value));

export const courseCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(120, "El nombre no debe superar los 120 caracteres"),
  colorTheme: optionalColorSchema,
  iconUrl: optionalUrlSchema,
});

export const courseUpdateSchema = courseCreateSchema.extend({
  id: courseIdSchema,
});

export const courseIdOnlySchema = z.object({
  id: courseIdSchema,
});

export type CourseCreateInput = z.infer<typeof courseCreateSchema>;
export type CourseUpdateInput = z.infer<typeof courseUpdateSchema>;

