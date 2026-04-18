import { z } from "zod";

export const lessonCreateSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres").max(255),
  description: z.string().optional(),
  lessonType: z.enum(["GENERIC", "REVIEW", "PRACTICE", "MIXED"]).default("GENERIC"),
});

export const lessonUpdateSchema = z.object({
  lessonId: z.string().uuid("ID de lección inválido"),
  title: z.string().min(3, "El título debe tener al menos 3 caracteres").max(255),
  description: z.string().optional(),
  lessonType: z.enum(["GENERIC", "REVIEW", "PRACTICE", "MIXED"]).default("GENERIC"),
});

export const lessonIdOnlySchema = z.object({
  lessonId: z.string().uuid("ID de lección inválido"),
});

export const addQuestionToLessonSchema = z.object({
  lessonId: z.string().uuid("ID de lección inválido"),
  questionId: z.string().uuid("ID de pregunta inválido"),
});

export const removeQuestionFromLessonSchema = addQuestionToLessonSchema;

export const reorderLessonQuestionSchema = z.object({
  lessonId: z.string().uuid("ID de lección inválido"),
  questionId: z.string().uuid("ID de pregunta inválido"),
  orderIndex: z.number().int().min(0),
});

export type LessonCreateInput = z.infer<typeof lessonCreateSchema>;
export type LessonUpdateInput = z.infer<typeof lessonUpdateSchema>;

