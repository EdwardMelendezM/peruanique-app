import { LessonAttemptInput } from '../types';
import { prisma } from "@/lib/prisma"

export async function syncUserAttempts(userId: string, attempts: LessonAttemptInput[]) {
  const syncedIds: string[] = [];

  // Usamos una transacción para asegurar que o se guardan todos o ninguno
  await prisma.$transaction(async (tx) => {
    for (const attempt of attempts) {
      await tx.lessonAttempt.upsert({
        where: { id: attempt.id },
        update: {}, // Si ya existe, ignoramos (evita errores en re-sincronización)
        create: {
          id: attempt.id,
          userId: userId,
          nodeId: attempt.nodeId,
          questionId: attempt.questionId,
          selectedAnswerId: attempt.selectedAnswerId,
          isCorrect: attempt.isCorrect,
          timeSeconds: attempt.timeSeconds,
          answeredAt: attempt.answeredAt,
        },
      });
      syncedIds.push(attempt.id);
    }
  });

  return { success: true, syncedIds };
}