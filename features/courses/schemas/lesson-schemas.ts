import { z } from "zod";

const lessonIdSchema = z.string().uuid("Identificador inválido");
const courseIdSchema = z.string().uuid("Curso inválido");

const optionalDescriptionSchema = z
  .union([z.string().trim().max(4000, "La descripción es demasiado larga"), z.literal("")])
  .transform((value) => (value === "" ? null : value));

export const createLessonSchema = z.object({
  courseId: courseIdSchema,
  title: z
    .string()
    .trim()
    .min(2, "El título debe tener al menos 2 caracteres")
    .max(180, "El título no debe superar los 180 caracteres"),
  description: optionalDescriptionSchema,
});

export const updateLessonSchema = createLessonSchema.extend({
  lessonId: lessonIdSchema,
});

export const deleteLessonSchema = z.object({
  courseId: courseIdSchema,
  lessonId: lessonIdSchema,
});

export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;

