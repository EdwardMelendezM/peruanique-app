import { prisma } from "@/lib/prisma"
import { OfflineData, SyncOptions } from "@/features/sync/types"
import { getContentByCourses } from "@/features/sync/actions/get-content-by-courses"
import { getRoadmapData } from "@/features/sync/actions/get-roadmap-data"

export async function getOfflineContent({ groupId, userId, domains }: SyncOptions): Promise<OfflineData> {
  const results: OfflineData = {};
  const isInitialSync = domains.length === 0;

  // 1. Validar si necesitamos actualizar la lista global de cursos
  if (isInitialSync || domains.includes("COURSES_CONTENT")) {
    const courses = await prisma.course.findMany();
    results.courses = courses.map(c => ({
      ...c,
      updatedAt: c.updatedAt.getTime()
    }));
  }

  // 2. Validar si necesitamos Roadmaps específicos
  if (isInitialSync || domains.includes(`ROADMAP:${groupId}`)) {
    const { roadmap, lessons } = await getRoadmapData(groupId);
    results.roadmap = roadmap;
    results.lessons = lessons;
  }

  // 3. Validar si hay cubetas de preguntas específicas (QUESTIONS:courseId)
  const courseIdsToSync = domains
    .filter(d => d.startsWith("QUESTIONS:"))
    .map(d => d.split(":")[1]);

  if (courseIdsToSync.length > 0 || isInitialSync) {
    // Si es initialSync, primero necesitamos saber qué cursos tiene el grupo
    let finalCourseIds = courseIdsToSync;

    if (isInitialSync) {
      const groupCourses = await prisma.question.findMany({
        where: { lessons: { some: { lesson: { roadmapNodes: { some: { groupId } } } } } },
        select: { courseId: true },
        distinct: ['courseId']
      });
      finalCourseIds = groupCourses.map(c => c.courseId);
    }

    const content = await getContentByCourses(finalCourseIds);
    results.questions = content.questions;
    results.answers = content.answers;
    results.lessonQuestions = content.lessonQuestions;
  }

  // 4. Datos del Usuario (Se sincronizan siempre por ser ligeros y críticos)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true }
  });

  if (user) {
    results.userProfile = {
      userId: user.id,
      full_name: user.full_name,
      totalXp: user.totalXp,
      streakDays: user.streakDays,
      targetUniversity: user.profile?.targetUniversity || null,
    };

    const userProgress = await prisma.userProgress.findMany({
      where: { userId, node: { groupId } }
    });

    results.userProgress = userProgress.map(p => ({
      ...p,
      updatedAt: p.updatedAt.getTime()
    }));
  }

  return results;
}