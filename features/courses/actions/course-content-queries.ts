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
  lessonId: string;
  questionText: string;
  explanationText: string | null;
  from: string | null;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "PROFESSIONAL";
  type: "MULTIPLE_CHOICE" | "DRAG_AND_DROP";
  answers: CourseAnswerItem[];
};

export type CourseLessonWithQuestions = {
  id: string;
  title: string;
  questions: CourseQuestionItem[];
};

export type CourseQuestionTree = {
  course: {
    id: string;
    name: string;
  };
  lessons: CourseLessonWithQuestions[];
};

export async function getCourseQuestionTree(
  courseId: string
): Promise<{ success: true; data: CourseQuestionTree } | { success: false; error: string }> {
  const session = await getSession();
  if (!session.success) {
    return { success: false, error: "No autorizado" };
  }

  const parsed = courseIdOnlySchema.safeParse({ id: courseId });

  if (!parsed.success) {
    return { success: false, error: "Curso inválido" };
  }

  const course = await prisma.course.findUnique({
    where: { id: parsed.data.id },
    select: {
      id: true,
      name: true,
      lessons: {
        orderBy: { title: "asc" },
        select: {
          id: true,
          title: true,
          questions: {
            orderBy: { updatedAt: "desc" },
            select: {
              id: true,
              lessonId: true,
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
      lessons: course.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        questions: lesson.questions.map((question) => ({
          id: question.id,
          lessonId: question.lessonId,
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
      })),
    },
  };
}

