"use server"

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";

export type CourseItem = {
  id: string;
  name: string;
};

export type LessonQueryItem = {
  id: string;
  title: string;
  description: string | null;
  lessonType: string;
  questionsCount: number;
  updatedAt: Date;
};

export async function getAllLessons(): Promise<
  { success: true; lessons: LessonQueryItem[] } | { success: false, error: string }
> {
  const session = await getSession();
  if (!session.success) {
    return { success: false, error: "No autorizado" };
  }

  const lessons = await prisma.lesson.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      lessonType: true,
      updatedAt: true,
      _count: {
        select: { questions: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    success: true,
    lessons: lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      lessonType: lesson.lessonType,
      questionsCount: lesson._count.questions,
      updatedAt: lesson.updatedAt,
    })),
  };
}

export type LessonDetailWithQuestions = {
  id: string;
  title: string;
  description: string | null;
  lessonType: string;
  questions: Array<{
    id: string;
    questionId: string;
    orderIndex: number;
    question: {
      id: string;
      questionText: string;
      courseName: string;
    };
  }>;
};

export async function getLessonWithQuestions(lessonId: string): Promise<
  { success: true; lesson: LessonDetailWithQuestions } | { success: false, error: string }
> {
  const session = await getSession();
  if (!session.success) {
    return { success: false, error: "No autorizado" };
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      title: true,
      description: true,
      lessonType: true,
      questions: {
        select: {
          id: true,
          questionId: true,
          orderIndex: true,
          question: {
            select: {
              id: true,
              questionText: true,
              course: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!lesson) {
    return { success: false, error: "Lección no encontrada" };
  }

  return {
    success: true,
    lesson: {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      lessonType: lesson.lessonType,
      questions: lesson.questions.map((lq) => ({
        id: lq.id,
        questionId: lq.questionId,
        orderIndex: lq.orderIndex,
        question: {
          id: lq.question.id,
          questionText: lq.question.questionText,
          courseName: lq.question.course.name,
        },
      })),
    },
  };
}

export type LessonDetailWithQuestionsAndAnswers = {
  id: string;
  title: string;
  description: string | null;
  lessonType: string;
  questions: Array<{
    id: string;
    questionId: string;
    orderIndex: number;
    question: {
      id: string;
      questionText: string;
      explanationText: string | null;
      difficulty: string;
      type: string;
      from: string | null;
      courseName: string;
      answers: Array<{
        id: string;
        answerText: string;
        isCorrect: boolean;
      }>;
    };
  }>;
};

export async function getLessonWithQuestionsAndAnswers(lessonId: string): Promise<
  { success: true; lesson: LessonDetailWithQuestionsAndAnswers } | { success: false, error: string }
> {
  const session = await getSession();
  if (!session.success) {
    return { success: false, error: "No autorizado" };
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      title: true,
      description: true,
      lessonType: true,
      questions: {
        select: {
          id: true,
          questionId: true,
          orderIndex: true,
          question: {
            select: {
              id: true,
              questionText: true,
              explanationText: true,
              difficulty: true,
              type: true,
              from: true,
              course: {
                select: {
                  name: true,
                },
              },
              answers: {
                orderBy: [{ isCorrect: "desc" }, { id: "asc" }],
                select: {
                  id: true,
                  answerText: true,
                  isCorrect: true,
                },
              },
            },
          },
        },
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!lesson) {
    return { success: false, error: "Lección no encontrada" };
  }

  return {
    success: true,
    lesson: {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      lessonType: lesson.lessonType,
      questions: lesson.questions.map((lq) => ({
        id: lq.id,
        questionId: lq.questionId,
        orderIndex: lq.orderIndex,
        question: {
          id: lq.question.id,
          questionText: lq.question.questionText,
          explanationText: lq.question.explanationText,
          difficulty: lq.question.difficulty,
          type: lq.question.type,
          from: lq.question.from,
          courseName: lq.question.course.name,
          answers: lq.question.answers,
        },
      })),
    },
  };
}
