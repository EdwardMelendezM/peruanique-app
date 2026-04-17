"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";
import {
  createLessonSchema,
  deleteLessonSchema,
  updateLessonSchema,
  type CreateLessonInput,
  type UpdateLessonInput,
} from "../schemas/lesson-schemas";

type LessonField = "courseId" | "lessonId" | "title" | "description";

export type LessonActionState = {
  success: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Partial<Record<LessonField, string>>;
};

const getStringValue = (value: FormDataEntryValue | null) => {
  return typeof value === "string" ? value : "";
};

const mapCreateData = (formData: FormData): CreateLessonInput => {
  return {
    courseId: getStringValue(formData.get("courseId")),
    title: getStringValue(formData.get("title")),
    description: getStringValue(formData.get("description")),
  };
};

const mapUpdateData = (formData: FormData): UpdateLessonInput => {
  return {
    lessonId: getStringValue(formData.get("lessonId")),
    courseId: getStringValue(formData.get("courseId")),
    title: getStringValue(formData.get("title")),
    description: getStringValue(formData.get("description")),
  };
};

const revalidateCourseContent = (courseId: string) => {
  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}/edit`);
  revalidatePath(`/admin/courses/${courseId}/lessons`);
  revalidatePath(`/admin/courses/${courseId}/questions`);
};

export async function createLesson(
  _state: LessonActionState,
  formData: FormData
): Promise<LessonActionState> {
  const session = await getSession();
  if (!session.success) {
    return { success: false, error: "No autorizado" };
  }

  const parsed = createLessonSchema.safeParse(mapCreateData(formData));
  if (!parsed.success) {
    const fieldErrors: NonNullable<LessonActionState["fieldErrors"]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "courseId" || key === "title" || key === "description") {
        fieldErrors[key] = issue.message;
      }
    }

    return {
      success: false,
      error: "Revisa los campos marcados",
      fieldErrors,
    };
  }

  const course = await prisma.course.findUnique({
    where: { id: parsed.data.courseId },
    select: { id: true },
  });

  if (!course) {
    return {
      success: false,
      error: "No se encontró el curso para crear la lección",
      fieldErrors: { courseId: "Curso inválido" },
    };
  }

  await prisma.lesson.create({
    data: {
      courseId: parsed.data.courseId,
      title: parsed.data.title,
      description: parsed.data.description,
    },
  });

  revalidateCourseContent(parsed.data.courseId);

  return {
    success: true,
    message: "Lección creada correctamente",
  };
}

export async function updateLesson(
  _state: LessonActionState,
  formData: FormData
): Promise<LessonActionState> {
  const session = await getSession();
  if (!session.success) {
    return { success: false, error: "No autorizado" };
  }

  const parsed = updateLessonSchema.safeParse(mapUpdateData(formData));
  if (!parsed.success) {
    const fieldErrors: NonNullable<LessonActionState["fieldErrors"]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "courseId" || key === "lessonId" || key === "title" || key === "description") {
        fieldErrors[key] = issue.message;
      }
    }

    return {
      success: false,
      error: "Revisa los campos marcados",
      fieldErrors,
    };
  }

  const lesson = await prisma.lesson.findFirst({
    where: {
      id: parsed.data.lessonId,
      courseId: parsed.data.courseId,
    },
    select: { id: true },
  });

  if (!lesson) {
    return {
      success: false,
      error: "La lección no existe o no pertenece al curso",
    };
  }

  await prisma.lesson.update({
    where: { id: parsed.data.lessonId },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
    },
  });

  revalidateCourseContent(parsed.data.courseId);

  return {
    success: true,
    message: "Lección actualizada correctamente",
  };
}

export async function deleteLesson(courseId: string, lessonId: string): Promise<LessonActionState> {
  const session = await getSession();
  if (!session.success) {
    return { success: false, error: "No autorizado" };
  }

  const parsed = deleteLessonSchema.safeParse({ courseId, lessonId });
  if (!parsed.success) {
    return {
      success: false,
      error: "Solicitud inválida",
    };
  }

  const lesson = await prisma.lesson.findFirst({
    where: {
      id: parsed.data.lessonId,
      courseId: parsed.data.courseId,
    },
    select: {
      id: true,
      _count: {
        select: {
          questions: true,
        },
      },
    },
  });

  if (!lesson) {
    return {
      success: false,
      error: "La lección no existe o no pertenece al curso",
    };
  }

  await prisma.lesson.delete({
    where: { id: parsed.data.lessonId },
  });

  revalidateCourseContent(parsed.data.courseId);

  return {
    success: true,
    message:
      lesson._count.questions > 0
        ? `Lección eliminada junto con ${lesson._count.questions} pregunta(s)`
        : "Lección eliminada correctamente",
  };
}

