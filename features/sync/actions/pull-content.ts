import { prisma } from "@/lib/prisma"

export async function getOfflineContent(groupId: string, userId: string) {
  // 1. Obtener el Roadmap y las Lecciones asociadas
  const roadmapNodes = await prisma.roadmapNode.findMany({
    where: { groupId },
    include: {
      lesson: true,
    },
    orderBy: { orderIndex: "asc" },
  })

  const nodeIds = roadmapNodes.map((n) => n.id)

  const lessonIds = roadmapNodes.map((n) => n.lessonId)

  // 2. Obtener la relación Many-to-Many de preguntas para esas lecciones
  const lessonQuestions = await prisma.lessonQuestion.findMany({
    where: { lessonId: { in: lessonIds } },
    orderBy: { orderIndex: "asc" },
  })

  const questionIds = lessonQuestions.map((lq) => lq.questionId)

  // 3. Obtener las Preguntas, sus Respuestas y sus Cursos
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    include: {
      answers: true,
      course: true,
    },
  })

  // 4. Aplanar la data para cumplir con el esquema de Drizzle (Mobile)
  // Usamos un Map para evitar duplicados de cursos
  const coursesMap = new Map()

  const formattedQuestions = questions.map((q) => {
    if (!coursesMap.has(q.course.id)) {
      coursesMap.set(q.course.id, q.course)
    }

    return {
      id: q.id,
      courseId: q.courseId,
      questionText: q.questionText,
      explanationText: q.explanationText,
      difficulty: q.difficulty,
      type: q.type,
      from_source: q.from, // Mapeo de 'from' (Prisma) a 'from_source' (Drizzle)
      updatedAt: q.updatedAt.getTime(), // Convertimos Date a timestamp para SQLite
    }
  })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  })

  // B. Obtener el progreso del usuario (solo para los nodos de este grupo)
  const userProgress = await prisma.userProgress.findMany({
    where: {
      userId,
      nodeId: { in: nodeIds }, // Optimización: Solo traemos progreso relevante a este roadmap
    },
  })

  const mappedUserProfile = user
    ? {
        userId: user.id,
        full_name: user.full_name,
        targetUniversity: user.profile?.targetUniversity || null,
        currentLevelTag: user.profile?.currentLevelTag || "novato",
        totalXp: user.totalXp,
        streakDays: user.streakDays,
      }
    : null

  return {
    courses: Array.from(coursesMap.values()).map((c) => ({
      ...c,
      updatedAt: c.updatedAt.getTime(),
    })),
    lessons: roadmapNodes.map((rn) => ({
      ...rn.lesson,
      updatedAt: rn.lesson.updatedAt.getTime(),
    })),
    questions: formattedQuestions,
    answers: questions.flatMap((q) =>
      q.answers.map((a) => ({
        id: a.id,
        questionId: a.questionId,
        answerText: a.answerText,
        isCorrect: a.isCorrect,
      }))
    ),
    roadmap: roadmapNodes.map(({ lesson, ...node }) => ({
      ...node,
      updatedAt: node.updatedAt.getTime(),
    })),
    lessonQuestions: lessonQuestions.map((lq) => ({
      ...lq,
      updatedAt: lq.updatedAt.getTime(),
    })),
    userProfile: mappedUserProfile,
    userProgress: userProgress.map((p) => ({
      id: p.id,
      userId: p.userId,
      nodeId: p.nodeId,
      status: p.status,
      scoreObtained: p.scoreObtained,
      starsEarned: p.starsEarned,
      updatedAt: p.updatedAt.getTime(), // Convertido para Drizzle timestamp
    })),
  }
}
