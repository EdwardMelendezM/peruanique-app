import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";
import { courseIdOnlySchema } from "../schemas/course-schemas";

export type CourseAnswerItem = {
  id: string;
  answerText: string;
  isCorrect: boolean;
};

export type CourseQuestionItem = {
  id: string;
  questionText: string;
  explanationText: string | null;
  from: string | null;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "PROFESSIONAL";
  type: "MULTIPLE_CHOICE" | "DRAG_AND_DROP";
  answers: CourseAnswerItem[];
};

export type CourseQuestionTree = {
  course: {
    id: string;
    name: string;
  };
  questions: CourseQuestionItem[];
};

export type CourseItem = {
  id: string;
  name: string;
};

export async function getAllCourses(): Promise<
  { success: true; courses: CourseItem[] } | { success: false, error: string }
> {
  const session = await getSession();
  if (!session.success) {
    return { success: false, error: "No autorizado" };
  }

  const courses = await prisma.course.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: "asc" },
  });

  return {
    success: true,
    courses,
  };
}

export async function getCourseQuestionTree(
  courseId: string
): Promise<{ success: true; data: CourseQuestionTree } | { success: false, error: string }> {
  const session = await getSession();
  if (!session.success) {
    return { success: false, error: "No autorizado" };
  }

  const parsed = courseIdOnlySchema.safeParse({ id: courseId });

  if (!parsed.success) {
    return { success: false, error: "Curso inválido" };
  }

  // Obtener curso con sus preguntas directamente (no a través de lecciones)
  const course = await prisma.course.findUnique({
    where: { id: parsed.data.id },
    select: {
      id: true,
      name: true,
      questions: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          questionText: true,
          explanationText: true,
          from: true,
          difficulty: true,
          type: true,
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
  });

  if (!course) {
    return { success: false, error: "No se encontró el curso" };
  }

  return {
    success: true,
    data: {
      course: {
        id: course.id,
        name: course.name,
      },
      questions: course.questions.map((question) => ({
        id: question.id,
        questionText: question.questionText,
        explanationText: question.explanationText,
        from: question.from,
        difficulty: question.difficulty,
        type: question.type,
        answers: question.answers.map((answer) => ({
          id: answer.id,
          answerText: answer.answerText,
          isCorrect: answer.isCorrect,
        })),
      })),
    },
  };
}
