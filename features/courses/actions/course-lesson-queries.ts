import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";
import { courseIdOnlySchema } from "../schemas/course-schemas";

export type CourseLessonItem = {
  id: string;
  title: string;
  description: string | null;
  questionsCount: number;
  updatedAt: Date;
};

export type CourseLessonTree = {
  course: {
    id: string;
    name: string;
  };
  lessons: CourseLessonItem[];
};

export async function getCourseLessons(
  courseId: string
): Promise<{ success: true; data: CourseLessonTree } | { success: false; error: string }> {
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
        orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
        select: {
          id: true,
          title: true,
          description: true,
          updatedAt: true,
          _count: {
            select: {
              questions: true,
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
        description: lesson.description,
        questionsCount: lesson._count.questions,
        updatedAt: lesson.updatedAt,
      })),
    },
  };
}

