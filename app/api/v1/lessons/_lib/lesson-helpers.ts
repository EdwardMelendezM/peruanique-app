import { Difficulty, ProgressStatus } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { startOfDay, subDays, isSameDay } from 'date-fns';

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
  // 1. Obtener el contexto del nodo (vital para no mezclar progresos)
  const roadmapNode = await findRoadmapNode(lessonId, userId);
  if (!roadmapNode) return null;

  const lessonQuestions = await prisma.lessonQuestion.findMany({
    where: { lessonId },
    orderBy: { orderIndex: "asc" },
    select: { questionId: true }
  });

  const questionIds = lessonQuestions.map(lq => lq.questionId);

  // 2. Obtener intentos filtrados por este NODO específico
  const userAttempts = await prisma.lessonAttempt.findMany({
    where: {
      userId,
      nodeId: roadmapNode.id, // 👈 Filtro por nodo
      questionId: { in: questionIds },
    },
    select: { questionId: true, isCorrect: true },
  });

  // 3. Crear un set de preguntas ya superadas (Correctas)
  // Usamos un Set de IDs que SI fueron correctos alguna vez
  const correctQuestionIds = new Set(
    userAttempts.filter(a => a.isCorrect).map(a => a.questionId)
  );

  // 4. Crear un set de preguntas intentadas (para saber cuáles fallaron)
  const attemptedQuestionIds = new Set(userAttempts.map(a => a.questionId));

  // Lógica de selección (KISS)
  const allQuestions = await getAllLessonQuestions(lessonId);

  // Prioridad 1: No intentada nunca en este nodo
  const firstNeverAttempted = allQuestions.find(q => !attemptedQuestionIds.has(q.id));
  if (firstNeverAttempted) return firstNeverAttempted;

  // Prioridad 2: Intentada pero NUNCA acertada
  const firstNeverCorrect = allQuestions.find(q => !correctQuestionIds.has(q.id));
  if (firstNeverCorrect) return firstNeverCorrect;

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

  return prisma.roadmapNode.findFirst({
    where: {
      lessonId,
      groupId: user.groupId,
    },
    select: {
      id: true,
    },
  })
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

/**
 * Obtiene el estado de progreso (ProgressStatus) de un usuario en un nodo
 * Retorna: "COMPLETED" | "IN_PROGRESS" | "LOCKED" | null si no existe progreso
 */
const getProgressStatus = async (
  nodeId: string,
  userId: string
): Promise<ProgressStatus | null> => {
  const progress = await prisma.userProgress.findUnique({
    where: {
      userId_nodeId: {
        userId,
        nodeId,
      },
    },
    select: {
      status: true,
    },
  });

  return progress?.status || null;
};

/**
 * Obtiene todas las preguntas de una lección (sin filtros de completitud)
 * Útil para modo retry/práctica
 */
const getAllLessonQuestions = async (lessonId: string) => {
  const lessonQuestions = await prisma.lessonQuestion.findMany({
    where: { lessonId },
    select: {
      questionId: true,
      orderIndex: true,
    },
    orderBy: { orderIndex: "asc" },
  });

  if (lessonQuestions.length === 0) {
    return [];
  }

  const questionIds = lessonQuestions.map((lq) => lq.questionId);
  const allQuestions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    select: {
      id: true,
      questionText: true,
      difficulty: true,
      type: true,
      from: true,
      metadata: true, // ✅ Incluir metadata para nuevos tipos
      answers: {
        select: {
          id: true,
          answerText: true,
          metadata: true, // ✅ Incluir metadata para respuestas
        },
      },
    },
  });

  // Mantén el orden de la lección
  const questionMap = new Map(allQuestions.map((q) => [q.id, q]));
  const orderedQuestions = questionIds
    .map((id) => questionMap.get(id))
    .filter((q): q is NonNullable<typeof q> => q !== undefined);

  return orderedQuestions;
};

// Exportar funciones para uso en rutas
/**
 * Valida si una lección está desbloqueada para un usuario.
 * 
 * Reglas de desbloqueo:
 * - Primera lección (orderIndex 1): siempre desbloqueada
 * - Otras lecciones: solo si la lección anterior está COMPLETED
 * 
 * @param lessonId UUID de la lección
 * @param userId UUID del usuario
 * @returns true si la lección está desbloqueada, false en caso contrario
 */
const isLessonUnlocked = async (lessonId: string, userId: string): Promise<boolean> => {
  // 1. Obtener el RoadmapNode de la lección
  const roadmapNode = await prisma.roadmapNode.findFirst({
    where: { lessonId },
    select: {
      id: true,
      orderIndex: true,
      groupId: true,
    },
  });

  if (!roadmapNode) {
    // Si la lección no está en el roadmap, no está desbloqueada
    return false;
  }

  // 2. Primera lección siempre está desbloqueada
  if (roadmapNode.orderIndex === 1) {
    return true;
  }

  // 3. Para lecciones posteriores, verificar que la anterior está COMPLETED
  const previousNode = await prisma.roadmapNode.findFirst({
    where: {
      groupId: roadmapNode.groupId,
      orderIndex: roadmapNode.orderIndex - 1,
    },
    select: {
      id: true,
    },
  });

  if (!previousNode) {
    // Si no existe lección anterior (corrupted data), no permitir acceso
    return false;
  }

  // 4. Verificar que lección anterior está COMPLETED
  const previousProgress = await prisma.userProgress.findUnique({
    where: {
      userId_nodeId: {
        userId,
        nodeId: previousNode.id,
      },
    },
    select: {
      status: true,
    },
  });

  // Lección anterior debe estar COMPLETED
  return previousProgress?.status === "COMPLETED";
};

async function updateStreak(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const now = new Date();
  const lastActivity = user.lastActivityAt;

  // Si es la primera vez que hace algo
  if (!lastActivity) {
    return prisma.user.update({
      where: { id: userId },
      data: { streakDays: 1, lastActivityAt: now }
    })
  }

  const today = startOfDay(now);
  const yesterday = startOfDay(subDays(now, 1));
  const lastActivityDay = startOfDay(lastActivity);

  if (isSameDay(lastActivityDay, today)) {
    // Caso 1: Ya practicó hoy, no hacemos nada a la racha
    return user;
  } else if (isSameDay(lastActivityDay, yesterday)) {
    // Caso 2: Practicó ayer, incrementamos racha
    return prisma.user.update({
      where: { id: userId },
      data: {
        streakDays: { increment: 1 },
        lastActivityAt: now
      }
    })
  } else {
    // Caso 3: Pasó más de un día, racha se reinicia
    return prisma.user.update({
      where: { id: userId },
      data: {
        streakDays: 1,
        lastActivityAt: now
      }
    })
  }
}

export { 
  calculateXpDelta, 
  getNextQuestion, 
  findRoadmapNode, 
  countCompletedQuestions, 
  getTotalQuestions, 
  getLessonProgress,
  getProgressStatus,
  getAllLessonQuestions,
  isLessonUnlocked,
  updateStreak
};
