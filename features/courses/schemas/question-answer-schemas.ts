import { z } from "zod";

const uuidSchema = z.string().uuid("Identificador inválido");

const optionalTextSchema = z
  .union([z.string().trim().max(4000, "El texto es demasiado largo"), z.literal("")])
  .transform((value) => (value === "" ? null : value));

const optionalSourceSchema = z
  .union([z.string().trim().max(255, "La fuente es demasiado larga"), z.literal("")])
  .transform((value) => (value === "" ? null : value));

export const difficultyValues = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "PROFESSIONAL"] as const;
export const questionTypeValues = [
  "MULTIPLE_CHOICE",
  "DRAG_AND_DROP",
  "LONG_TEXT",
  "MATH_EXPRESSION",
  "IMAGE_BASED",
] as const;

export const createQuestionSchema = z.object({
  courseId: uuidSchema,
  // lessonId: uuidSchema,
  questionText: z
    .string()
    .trim()
    .min(10, "La pregunta debe tener al menos 10 caracteres")
    .max(4000, "La pregunta es demasiado larga"),
  explanationText: optionalTextSchema,
  from: optionalSourceSchema,
  difficulty: z.enum(difficultyValues),
  type: z.enum(questionTypeValues),
  metadata: z
    .union([z.string().max(4000, "Metadata demasiado largo"), z.literal("")])
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined;
      if (value === "") return null;
      return value;
    }),
});

export const updateQuestionSchema = createQuestionSchema.extend({
  questionId: uuidSchema,
});

export const deleteQuestionSchema = z.object({
  courseId: uuidSchema,
  questionId: uuidSchema,
});

export const createAnswerSchema = z.object({
  courseId: uuidSchema,
  questionId: uuidSchema,
  answerText: z
    .string()
    .trim()
    .min(1, "La respuesta no puede estar vacía")
    .max(2000, "La respuesta es demasiado larga"),
  isCorrect: z.boolean(),
});

// Allow optional metadata for answers (e.g., coordinates for IMAGE_BASED)
export const createAnswerSchemaWithMetadata = createAnswerSchema.extend({
  metadata: z
    .union([z.string().max(4000, "Metadata demasiado largo"), z.literal("")])
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined;
      if (value === "") return null;
      return value;
    }),
});

export const updateAnswerSchema = createAnswerSchemaWithMetadata.extend({
  answerId: uuidSchema,
});

export const deleteAnswerSchema = z.object({
  courseId: uuidSchema,
  questionId: uuidSchema,
  answerId: uuidSchema,
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type DeleteQuestionInput = z.infer<typeof deleteQuestionSchema>;
export type CreateAnswerInput = z.infer<typeof createAnswerSchema>;
export type UpdateAnswerInput = z.infer<typeof updateAnswerSchema>;
export type DeleteAnswerInput = z.infer<typeof deleteAnswerSchema>;

