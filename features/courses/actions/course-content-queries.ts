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
  questions: CourseQuestionItem[];
};

export type CourseQuestionTreeWithLessons = {
  course: {
    id: string;
    name: string;
  };
  lessons: CourseLessonWithQuestions[];
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

export async function getCourseQuestionsWithLessons(
  courseId: string
): Promise<{ success: true; data: CourseQuestionTreeWithLessons } | { success: false, error: string }> {
  const session = await getSession();
  if (!session.success) {
    return { success: false, error: "No autorizado" };
  }

  const parsed = courseIdOnlySchema.safeParse({ id: courseId });

  if (!parsed.success) {
    return { success: false, error: "Curso inválido" };
  }

  // Get course with lessons and their questions
  const course = await prisma.course.findUnique({
    where: { id: parsed.data.id },
    select: {
      id: true,
      name: true,
    },
  });

  if (!course) {
    return { success: false, error: "No se encontró el curso" };
  }

  // Get all lessons that have questions from this course
  const lessons = await prisma.lesson.findMany({
    where: { // <-- NUEVO: Filtro a nivel de Lesson
      questions: {
        some: {
          question: {
            courseId: parsed.data.id,
          },
        },
      },
    },
    select: {
      id: true,
      title: true,
      questions: {
        where: {
          question: {
            courseId: parsed.data.id,
          },
        },
        select: {
          question: {
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
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  // Also get questions that aren't in any lesson
  const allCourseQuestions = await prisma.question.findMany({
    where: { courseId: parsed.data.id },
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
  });

  const questionsInLessons = new Set<string>();
  const lessonsMapped = lessons.map((lesson) => {
    const mappedQuestions = lesson.questions.map((lq) => {
      questionsInLessons.add(lq.question.id);
      return lq.question as CourseQuestionItem;
    });
    return {
      id: lesson.id,
      title: lesson.title,
      questions: mappedQuestions,
    };
  });

  // Add unassigned questions as a special "Unassigned" lesson if they exist
  const unassignedQuestions = allCourseQuestions.filter((q) => !questionsInLessons.has(q.id));
  if (unassignedQuestions.length > 0) {
    lessonsMapped.push({
      id: "unassigned",
      title: "Sin asignar a lección",
      questions: unassignedQuestions as CourseQuestionItem[],
    });
  }

  return {
    success: true,
    data: {
      course: {
        id: course.id,
        name: course.name,
      },
      lessons: lessonsMapped,
    },
  };
}
