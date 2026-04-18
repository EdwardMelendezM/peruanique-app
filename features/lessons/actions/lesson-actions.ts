"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";
import {
  lessonCreateSchema,
  lessonUpdateSchema,
  lessonIdOnlySchema,
  addQuestionToLessonSchema,
  removeQuestionFromLessonSchema,
  reorderLessonQuestionSchema,
} from "../schemas/lesson-schemas";

export type LessonActionState = {
  success: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Partial<Record<"title" | "description" | "lessonType" | "lessonId", string>>;
  lessonId?: string;
};

const ensureAuth = async () => {
  const session = await getSession();
  return session.success;
};

const revalidateLessons = () => {
  revalidatePath("/admin/lessons");
};

export async function createLesson(
  _state: LessonActionState,
  formData: FormData
): Promise<LessonActionState> {
  if (!(await ensureAuth())) {
    return { success: false, error: "No autorizado" };
  }

  const parsed = lessonCreateSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    lessonType: formData.get("lessonType"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "title" || key === "description" || key === "lessonType") {
        fieldErrors[key] = issue.message;
      }
    }
    return { success: false, error: "Revisa los campos", fieldErrors };
  }

  const lesson = await prisma.lesson.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      lessonType: parsed.data.lessonType,
    },
  });

  revalidateLessons();

  return {
    success: true,
    lessonId: lesson.id,
    message: "Lección creada exitosamente",
  };
}

export async function updateLesson(
  _state: LessonActionState,
  formData: FormData
): Promise<LessonActionState> {
  if (!(await ensureAuth())) {
    return { success: false, error: "No autorizado" };
  }

  const parsed = lessonUpdateSchema.safeParse({
    lessonId: formData.get("lessonId"),
    title: formData.get("title"),
    description: formData.get("description"),
    lessonType: formData.get("lessonType"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "title" || key === "description" || key === "lessonType" || key === "lessonId") {
        fieldErrors[key] = issue.message;
      }
    }
    return { success: false, error: "Revisa los campos", fieldErrors };
  }

  const existingLesson = await prisma.lesson.findUnique({
    where: { id: parsed.data.lessonId },
  });

  if (!existingLesson) {
    return { success: false, error: "La lección no existe" };
  }

  await prisma.lesson.update({
    where: { id: parsed.data.lessonId },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      lessonType: parsed.data.lessonType,
    },
  });

  revalidateLessons();

  return { success: true, message: "Lección actualizada exitosamente" };
}

export async function deleteLesson(lessonId: string): Promise<LessonActionState> {
  if (!(await ensureAuth())) {
    return { success: false, error: "No autorizado" };
  }

  const parsed = lessonIdOnlySchema.safeParse({ lessonId });

  if (!parsed.success) {
    return { success: false, error: "ID de lección inválido" };
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: parsed.data.lessonId },
    select: {
      id: true,
      _count: {
        select: { questions: true, roadmapNodes: true },
      },
    },
  });

  if (!lesson) {
    return { success: false, error: "La lección no existe" };
  }

  if (lesson._count.roadmapNodes > 0) {
    return {
      success: false,
      error: "No se puede eliminar una lección que está en un roadmap. Elimina primero de los roadmaps.",
    };
  }

  await prisma.lesson.delete({
    where: { id: parsed.data.lessonId },
  });

  revalidateLessons();

  return {
    success: true,
    message: `Lección eliminada junto con ${lesson._count.questions} pregunta(s)`,
  };
}

export async function addQuestionToLesson(
  lessonId: string,
  questionId: string
): Promise<LessonActionState> {
  if (!(await ensureAuth())) {
    return { success: false, error: "No autorizado" };
  }

  const parsed = addQuestionToLessonSchema.safeParse({ lessonId, questionId });

  if (!parsed.success) {
    return { success: false, error: "Datos inválidos" };
  }

  // Verify lesson and question exist
  const [lesson, question] = await Promise.all([
    prisma.lesson.findUnique({ where: { id: parsed.data.lessonId }, select: { id: true } }),
    prisma.question.findUnique({ where: { id: parsed.data.questionId }, select: { id: true } }),
  ]);

  if (!lesson || !question) {
    return { success: false, error: "Lección o pregunta no encontrada" };
  }

  // Check if already exists
  const existingRelation = await prisma.lessonQuestion.findUnique({
    where: {
      lessonId_questionId: {
        lessonId: parsed.data.lessonId,
        questionId: parsed.data.questionId,
      },
    },
  });

  if (existingRelation) {
    return { success: false, error: "Esta pregunta ya está en la lección" };
  }

  // Get max orderIndex
  const lastQuestion = await prisma.lessonQuestion.findFirst({
    where: { lessonId: parsed.data.lessonId },
    orderBy: { orderIndex: "desc" },
    select: { orderIndex: true },
  });

  const newOrderIndex = (lastQuestion?.orderIndex ?? -1) + 1;

  await prisma.lessonQuestion.create({
    data: {
      lessonId: parsed.data.lessonId,
      questionId: parsed.data.questionId,
      orderIndex: newOrderIndex,
    },
  });

  revalidateLessons();

  return { success: true, message: "Pregunta agregada a la lección" };
}

export async function removeQuestionFromLesson(
  lessonId: string,
  questionId: string
): Promise<LessonActionState> {
  if (!(await ensureAuth())) {
    return { success: false, error: "No autorizado" };
  }

  const parsed = removeQuestionFromLessonSchema.safeParse({ lessonId, questionId });

  if (!parsed.success) {
    return { success: false, error: "Datos inválidos" };
  }

  const relation = await prisma.lessonQuestion.findUnique({
    where: {
      lessonId_questionId: {
        lessonId: parsed.data.lessonId,
        questionId: parsed.data.questionId,
      },
    },
  });

  if (!relation) {
    return { success: false, error: "La pregunta no está en esta lección" };
  }

  await prisma.lessonQuestion.delete({
    where: {
      lessonId_questionId: {
        lessonId: parsed.data.lessonId,
        questionId: parsed.data.questionId,
      },
    },
  });

  revalidateLessons();

  return { success: true, message: "Pregunta removida de la lección" };
}

export async function reorderLessonQuestion(
  lessonId: string,
  questionId: string,
  orderIndex: number
): Promise<LessonActionState> {
  if (!(await ensureAuth())) {
    return { success: false, error: "No autorizado" };
  }

  const parsed = reorderLessonQuestionSchema.safeParse({ lessonId, questionId, orderIndex });

  if (!parsed.success) {
    return { success: false, error: "Datos inválidos" };
  }

  const relation = await prisma.lessonQuestion.findUnique({
    where: {
      lessonId_questionId: {
        lessonId: parsed.data.lessonId,
        questionId: parsed.data.questionId,
      },
    },
  });

  if (!relation) {
    return { success: false, error: "La pregunta no está en esta lección" };
  }

  await prisma.lessonQuestion.update({
    where: {
      lessonId_questionId: {
        lessonId: parsed.data.lessonId,
        questionId: parsed.data.questionId,
      },
    },
    data: {
      orderIndex: parsed.data.orderIndex,
    },
  });

  revalidateLessons();

  return { success: true, message: "Orden actualizado" };
}

