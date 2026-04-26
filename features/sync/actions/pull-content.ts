import { prisma } from "@/lib/prisma";
import {
  OfflineContent,
  SyncOptions,
  SyncCourse,
  SyncLesson,
  SyncRoadmapNode,
  SyncQuestion,
  SyncAnswer,
  SyncLessonQuestion,
  SyncUserProgress,
  Difficulty,
  QuestionType,
} from "@/features/sync/types/pull-data";
import { getContentByCourses } from "@/features/sync/actions/get-content-by-courses";
import { getRoadmapData } from "@/features/sync/actions/get-roadmap-data";

export async function getOfflineContent({
                                          groupId,
                                          userId,
                                          domains
                                        }: SyncOptions): Promise<OfflineContent> {

  // Inicializamos el objeto con arrays vacíos para cumplir con la interfaz
  const results: OfflineContent = {
    courses: [],
    lessons: [],
    questions: [],
    answers: [],
    roadmap: [],
    lessonQuestions: [],
    userProfile: null,
    userProgress: []
  };

  const isInitialSync = domains.length === 0;

  // 1. Cursos (Global)
  if (isInitialSync || domains.includes("COURSES_CONTENT")) {
    const courses = await prisma.course.findMany();
    results.courses = courses.map((c): SyncCourse => ({
      id: c.id,
      name: c.name,
      colorTheme: c.colorTheme,
      iconUrl: c.iconUrl,
      updatedAt: c.updatedAt.getTime()
    }));
  }

  // 2. Roadmap y Lecciones
  if (isInitialSync || domains.includes(`ROADMAP:${groupId}`)) {
    const { roadmap, lessons } = await getRoadmapData(groupId);
    // Asumiendo que getRoadmapData ya devuelve el formato correcto o similar
    results.roadmap = roadmap as SyncRoadmapNode[];
    results.lessons = lessons as SyncLesson[];
  }

  // 3. Preguntas, Respuestas y Relaciones
  const courseIdsToSync = domains
    .filter(d => d.startsWith("QUESTIONS:"))
    .map(d => d.split(":")[1]);

  if (courseIdsToSync.length > 0 || isInitialSync) {
    let finalCourseIds = courseIdsToSync;

    if (isInitialSync) {
      const groupCourses = await prisma.question.findMany({
        where: {
          lessons: {
            some: { lesson: { roadmapNodes: { some: { groupId } } } }
          }
        },
        select: { courseId: true },
        distinct: ['courseId']
      });
      finalCourseIds = groupCourses.map(c => c.courseId);
    }

    // getContentByCourses debe devolver { questions, answers, lessonQuestions }
    const content = await getContentByCourses(finalCourseIds);

    results.questions = content.questions.map((q): SyncQuestion => ({
      ...q,
      difficulty: q.difficulty as Difficulty,
      type: q.type as QuestionType,
      from: q.from_source || null,
      updatedAt: new Date(q.updatedAt).getTime()
    }));

    results.answers = content.answers.map((a): SyncAnswer => ({
      id: a.id,
      questionId: a.questionId,
      answerText: a.answerText,
      isCorrect: a.isCorrect,
      isDisabled: a.isDisabled
    }));

    results.lessonQuestions = content.lessonQuestions.map((lq): SyncLessonQuestion => ({
      id: lq.id,
      lessonId: lq.lessonId,
      questionId: lq.questionId,
      orderIndex: lq.orderIndex,
      isDisabled: lq.isDisabled,
      updatedAt: new Date(lq.updatedAt).getTime()
    }));
  }

  // 4. Perfil de Usuario y Progreso
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true }
  });

  if (user) {
    results.userProfile = {
      userId: user.id,
      full_name: user.full_name,
      targetUniversity: user.profile?.targetUniversity || null,
      currentLevelTag: user.profile?.currentLevelTag || "novato",
      totalXp: user.totalXp,
      streakDays: user.streakDays,
    };

    const userProgress = await prisma.userProgress.findMany({
      where: { userId, node: { groupId } }
    });

    results.userProgress = userProgress.map((p): SyncUserProgress => ({
      id: p.id,
      userId: p.userId,
      nodeId: p.nodeId,
      status: p.status as 'LOCKED' | 'IN_PROGRESS' | 'COMPLETED',
      scoreObtained: p.scoreObtained,
      starsEarned: p.starsEarned,
      updatedAt: p.updatedAt.getTime()
    }));
  }

  return results;
}