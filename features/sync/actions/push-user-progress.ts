import { UserProgressInput } from "../types"
import { prisma } from "@/lib/prisma"

export async function syncUserProgress(userId: string, userProgressList: UserProgressInput[]) {
  const syncedIds: string[] = [];

  // Usamos una transacción para asegurar que o se guardan todos o ninguno
  await prisma.$transaction(async (tx) => {
    for (const userProgress of userProgressList) {
      await tx.userProgress.upsert({
        where: { id: userProgress.id },
        update: {}, // Si ya existe, ignoramos (evita errores en re-sincronización)
        create: {
          id: userProgress.id,
          userId: userId,
          nodeId: userProgress.nodeId,
          scoreObtained: userProgress.scoreObtained,
          starsEarned: userProgress.starsEarned,
        },
      });
      syncedIds.push(userProgress.id);
    }
  });

  return { success: true, syncedIds };
}