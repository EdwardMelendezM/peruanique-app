"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";
import {
  createAnswerSchema,
  createQuestionSchema,
  deleteAnswerSchema,
  deleteQuestionSchema,
  updateAnswerSchema,
  updateQuestionSchema,
} from "../schemas/question-answer-schemas";

type QuestionField = "courseId" | "questionId" | "questionText" | "explanationText" | "from" | "difficulty" | "type";
type AnswerField = "courseId" | "questionId" | "answerId" | "answerText" | "isCorrect";

export type QuestionActionState = {
  success: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Partial<Record<QuestionField, string>>;
};

export type AnswerActionState = {
  success: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Partial<Record<AnswerField, string>>;
};

const getStringValue = (value: FormDataEntryValue | null) => {
  return typeof value === "string" ? value : "";
};

const getBooleanValue = (value: FormDataEntryValue | null) => {
  return value === "on" || value === "true";
};

const revalidateCourseQuestions = (courseId: string) => {
  revalidatePath(`/admin/courses/${courseId}/questions`);
};

const ensureAuth = async () => {
  const session = await getSession();
  return session.success;
};

const mapQuestionCreateData = (formData: FormData) => ({
  courseId: getStringValue(formData.get("courseId")),
  questionText: getStringValue(formData.get("questionText")),
  explanationText: getStringValue(formData.get("explanationText")),
  from: getStringValue(formData.get("from")),
  difficulty: getStringValue(formData.get("difficulty")),
  type: getStringValue(formData.get("type")),
});

const mapQuestionUpdateData = (formData: FormData) => ({
  questionId: getStringValue(formData.get("questionId")),
  ...mapQuestionCreateData(formData),
});

const mapAnswerCreateData = (formData: FormData) => ({
  courseId: getStringValue(formData.get("courseId")),
  questionId: getStringValue(formData.get("questionId")),
  answerText: getStringValue(formData.get("answerText")),
  isCorrect: getBooleanValue(formData.get("isCorrect")),
});

const mapAnswerUpdateData = (formData: FormData) => ({
  answerId: getStringValue(formData.get("answerId")),
  ...mapAnswerCreateData(formData),
});

export async function createQuestion(
  _state: QuestionActionState,
  formData: FormData
): Promise<QuestionActionState> {
  if (!(await ensureAuth())) {
    return { success: false, error: "No autorizado" };
  }

  const parsed = createQuestionSchema.safeParse(mapQuestionCreateData(formData));

  if (!parsed.success) {
    const fieldErrors: NonNullable<QuestionActionState["fieldErrors"]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (
        key === "courseId" ||
        key === "questionText" ||
        key === "explanationText" ||
        key === "from" ||
        key === "difficulty" ||
        key === "type"
      ) {
        fieldErrors[key as QuestionField] = issue.message;
      }
    }

    return { success: false, error: "Revisa los campos del formulario", fieldErrors };
  }

  // Verify course exists
  const course = await prisma.course.findUnique({
    where: { id: parsed.data.courseId },
    select: { id: true },
  });

  if (!course) {
    return {
      success: false,
      error: "El curso no existe",
      fieldErrors: { courseId: "Selecciona un curso válido" },
    };
  }

  // Ahora la pregunta se crea directamente con courseId
  await prisma.question.create({
    data: {
      courseId: parsed.data.courseId,
      questionText: parsed.data.questionText,
      explanationText: parsed.data.explanationText,
      from: parsed.data.from,
      difficulty: parsed.data.difficulty,
      type: parsed.data.type,
    },
  });

  revalidateCourseQuestions(parsed.data.courseId);

  return { success: true, message: "Pregunta creada exitosamente" };
}

export async function updateQuestion(
  _state: QuestionActionState,
  formData: FormData
): Promise<QuestionActionState> {
  if (!(await ensureAuth())) {
    return { success: false, error: "No autorizado" };
  }

  const parsed = updateQuestionSchema.safeParse(mapQuestionUpdateData(formData));

  if (!parsed.success) {
    const fieldErrors: NonNullable<QuestionActionState["fieldErrors"]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (
        key === "courseId" ||
        key === "questionId" ||
        key === "questionText" ||
        key === "explanationText" ||
        key === "from" ||
        key === "difficulty" ||
        key === "type"
      ) {
        fieldErrors[key as QuestionField] = issue.message;
      }
    }

    return { success: false, error: "Revisa los campos del formulario", fieldErrors };
  }

  // Verify question belongs to course
  const existingQuestion = await prisma.question.findFirst({
    where: {
      id: parsed.data.questionId,
      courseId: parsed.data.courseId,
    },
    select: { id: true },
  });

  if (!existingQuestion) {
    return { success: false, error: "La pregunta no existe o no pertenece al curso" };
  }

  await prisma.question.update({
    where: { id: parsed.data.questionId },
    data: {
      questionText: parsed.data.questionText,
      explanationText: parsed.data.explanationText,
      from: parsed.data.from,
      difficulty: parsed.data.difficulty,
      type: parsed.data.type,
    },
  });

  revalidateCourseQuestions(parsed.data.courseId);

  return {
    success: true,
    message: "Pregunta actualizada correctamente",
  };
}

export async function deleteQuestion(courseId: string, questionId: string): Promise<QuestionActionState> {
  if (!(await ensureAuth())) {
    return { success: false, error: "No autorizado" };
  }

  const parsed = deleteQuestionSchema.safeParse({ courseId, questionId });

  if (!parsed.success) {
    return { success: false, error: "Solicitud inválida" };
  }

  const existingQuestion = await prisma.question.findFirst({
    where: {
      id: parsed.data.questionId,
      courseId: parsed.data.courseId,
    },
    select: {
      id: true,
      _count: {
        select: { answers: true },
      },
    },
  });

  if (!existingQuestion) {
    return { success: false, error: "La pregunta no existe o no pertenece al curso" };
  }

  await prisma.question.delete({
    where: { id: parsed.data.questionId },
  });

  revalidateCourseQuestions(parsed.data.courseId);

  return {
    success: true,
    message:
      existingQuestion._count.answers > 0
        ? `Pregunta eliminada junto con ${existingQuestion._count.answers} respuesta(s)`
        : "Pregunta eliminada correctamente",
  };
}

export async function createAnswer(
  _state: AnswerActionState,
  formData: FormData
): Promise<AnswerActionState> {
  if (!(await ensureAuth())) {
    return { success: false, error: "No autorizado" };
  }

  const parsed = createAnswerSchema.safeParse(mapAnswerCreateData(formData));

  if (!parsed.success) {
    const fieldErrors: NonNullable<AnswerActionState["fieldErrors"]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "courseId" || key === "questionId" || key === "answerText" || key === "isCorrect") {
        fieldErrors[key as AnswerField] = issue.message;
      }
    }

    return { success: false, error: "Revisa los campos del formulario", fieldErrors };
  }

  // Verify question belongs to course
  const question = await prisma.question.findFirst({
    where: {
      id: parsed.data.questionId,
      courseId: parsed.data.courseId,
    },
    select: { id: true },
  });

  if (!question) {
    return { success: false, error: "La pregunta no existe o no pertenece al curso" };
  }

  await prisma.answer.create({
    data: {
      questionId: parsed.data.questionId,
      answerText: parsed.data.answerText,
      isCorrect: parsed.data.isCorrect,
    },
  });

  revalidateCourseQuestions(parsed.data.courseId);

  return {
    success: true,
    message: "Respuesta creada correctamente",
  };
}

export async function updateAnswer(
  _state: AnswerActionState,
  formData: FormData
): Promise<AnswerActionState> {
  if (!(await ensureAuth())) {
    return { success: false, error: "No autorizado" };
  }

  const parsed = updateAnswerSchema.safeParse(mapAnswerUpdateData(formData));

  if (!parsed.success) {
    const fieldErrors: NonNullable<AnswerActionState["fieldErrors"]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (
        key === "courseId" ||
        key === "questionId" ||
        key === "answerId" ||
        key === "answerText" ||
        key === "isCorrect"
      ) {
        fieldErrors[key as AnswerField] = issue.message;
      }
    }

    return { success: false, error: "Revisa los campos del formulario", fieldErrors };
  }

  // Verify answer belongs to question and question belongs to course
  const answer = await prisma.answer.findFirst({
    where: {
      id: parsed.data.answerId,
      questionId: parsed.data.questionId,
      question: {
        courseId: parsed.data.courseId,
      },
    },
    select: { id: true },
  });

  if (!answer) {
    return { success: false, error: "La respuesta no existe o no pertenece al curso" };
  }

  await prisma.answer.update({
    where: { id: parsed.data.answerId },
    data: {
      answerText: parsed.data.answerText,
      isCorrect: parsed.data.isCorrect,
    },
  });

  revalidateCourseQuestions(parsed.data.courseId);

  return {
    success: true,
    message: "Respuesta actualizada correctamente",
  };
}

export async function deleteAnswer(
  courseId: string,
  questionId: string,
  answerId: string
): Promise<AnswerActionState> {
  if (!(await ensureAuth())) {
    return { success: false, error: "No autorizado" };
  }

  const parsed = deleteAnswerSchema.safeParse({ courseId, questionId, answerId });

  if (!parsed.success) {
    return { success: false, error: "Solicitud inválida" };
  }

  // Verify answer belongs to question and question belongs to course
  const answer = await prisma.answer.findFirst({
    where: {
      id: parsed.data.answerId,
      questionId: parsed.data.questionId,
      question: {
        courseId: parsed.data.courseId,
      },
    },
    select: { id: true },
  });

  if (!answer) {
    return { success: false, error: "La respuesta no existe o no pertenece al curso" };
  }

  await prisma.answer.delete({
    where: { id: parsed.data.answerId },
  });

  revalidateCourseQuestions(parsed.data.courseId);

  return {
    success: true,
    message: "Respuesta eliminada correctamente",
  };
}

