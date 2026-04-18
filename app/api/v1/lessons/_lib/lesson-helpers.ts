import { Difficulty } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

/**
 * Calcula el XP otorgado basado en la dificultad y si la respuesta fue correcta.
 * Sigue un esquema de progresión tipo Duolingo.
 */
const calculateXpDelta = (difficulty: Difficulty, isCorrect: boolean): number => {
  const xpMap: Record<Difficulty, { correct: number; incorrect: number }> = {
    BEGINNER: { correct: 10, incorrect: 5 },
    INTERMEDIATE: { correct: 25, incorrect: 10 },
    ADVANCED: { correct: 50, incorrect: 20 },
    PROFESSIONAL: { correct: 100, incorrect: 40 },
  };

  return isCorrect ? xpMap[difficulty].correct : xpMap[difficulty].incorrect;
};

/**
 * Obtiene la siguiente pregunta sin responder para una lección específica.
 * Prioriza preguntas no intentadas, luego preguntas incorrectas.
 * Ahora busca preguntas a través de la relación many-to-many LessonQuestion.
 */
const getNextQuestion = async (lessonId: string, userId: string) => {
  // Obtén todas las preguntas de la lección a través de LessonQuestion
  const lessonQuestions = await prisma.lessonQuestion.findMany({
    where: { lessonId },
    select: {
      questionId: true,
      orderIndex: true,
    },
    orderBy: { orderIndex: "asc" },
  });

  if (lessonQuestions.length === 0) {
    return null;
  }

  // Obtén los detalles de las preguntas
  const questionIds = lessonQuestions.map((lq) => lq.questionId);
  const allQuestions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    select: {
      id: true,
      questionText: true,
      difficulty: true,
      type: true,
      from: true,
      answers: {
        select: {
          id: true,
          answerText: true,
        },
      },
    },
  });

  // Mantén el orden de la lección
  const questionMap = new Map(allQuestions.map((q) => [q.id, q]));
  const orderedQuestions = questionIds
    .map((id) => questionMap.get(id))
    .filter((q): q is NonNullable<typeof q> => q !== undefined);

  // Obtén los intentos del usuario para esta lección
  const userAttempts = await prisma.lessonAttempt.findMany({
    where: {
      userId,
      questionId: { in: questionIds },
    },
    select: {
      questionId: true,
      isCorrect: true,
    },
  });

  const attemptMap = new Map(userAttempts.map((a) => [a.questionId, a.isCorrect]));

  // Prioridad 1: Pregunta sin intentar
  for (const question of orderedQuestions) {
    if (!attemptMap.has(question.id)) {
      return question;
    }
  }

  // Prioridad 2: Pregunta respondida incorrectamente
  for (const question of orderedQuestions) {
    if (attemptMap.has(question.id) && !attemptMap.get(question.id)) {
      return question;
    }
  }

  // Si todas están respondidas correctamente, retorna null
  return null;
};

/**
 * Encuentra el RoadmapNode actual del usuario para una lección específica.
 * Esto es necesario para registrar el intento en el contexto del roadmap.
 */
const findRoadmapNode = async (lessonId: string, userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { groupId: true },
  });

  if (!user?.groupId) {
    return null;
  }

  return await prisma.roadmapNode.findFirst({
    where: {
      lessonId,
      groupId: user.groupId,
    },
    select: {
      id: true,
    },
  });
};

/**
 * Cuenta el número de preguntas respondidas correctamente en una lección.
 * Ahora busca a través de LessonQuestion.
 */
const countCompletedQuestions = async (lessonId: string, userId: string): Promise<number> => {
  // Obtén los IDs de preguntas en esta lección
  const lessonQuestions = await prisma.lessonQuestion.findMany({
    where: { lessonId },
    select: { questionId: true },
  });

  const questionIds = lessonQuestions.map((lq) => lq.questionId);

  if (questionIds.length === 0) {
    return 0;
  }

  return prisma.lessonAttempt.count({
    where: {
      userId,
      questionId: { in: questionIds },
      isCorrect: true,
    },
  });
};

/**
 * Obtiene el total de preguntas en una lección.
 * Ahora cuenta a través de LessonQuestion.
 */
const getTotalQuestions = async (lessonId: string): Promise<number> => {
  return prisma.lessonQuestion.count({
    where: { lessonId },
  });
};

/**
 * Obtiene el progreso del usuario en una lección específica.
 * Retorna status, score, estrellas y conteo de preguntas.
 */
const getLessonProgress = async (lessonId: string, userId: string) => {
  // Obtener el RoadmapNode para la lección
  const roadmapNode = await findRoadmapNode(lessonId, userId);

  if (!roadmapNode) {
    return null;
  }

  // Obtener UserProgress
  const userProgress = await prisma.userProgress.findUnique({
    where: {
      userId_nodeId: {
        userId,
        nodeId: roadmapNode.id,
      },
    },
    select: {
      status: true,
      scoreObtained: true,
      starsEarned: true,
    },
  });

  if (!userProgress) {
    return null;
  }

  // Contar preguntas completadas y totales
  const completedQuestions = await countCompletedQuestions(lessonId, userId);
  const totalQuestions = await getTotalQuestions(lessonId);

  return {
    status: userProgress.status,
    score: userProgress.scoreObtained,
    starsEarned: userProgress.starsEarned,
    completedQuestions,
    totalQuestions,
  };
};

// Exportar funciones para uso en rutas
export { calculateXpDelta, getNextQuestion, findRoadmapNode, countCompletedQuestions, getTotalQuestions, getLessonProgress };
