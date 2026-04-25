import { SyncQueueInput } from "../types";
import { prisma } from "@/lib/prisma";

export async function syncStats(userId: string, syncQueues: SyncQueueInput[]) {
  try {
    const syncedIds: number[] = [];

    await prisma.$transaction(async (tx) => {
      // 1. Obtenemos el estado actual del servidor
      const profile = await tx.user.findUnique({
        where: { id: userId },
        select: { currentEnergy: true, maxEnergy: true, lastEnergyRefill: true }
      });

      if (!profile) throw new Error("Perfil no encontrado");

      // Objeto único de actualización (Performance Win)
      const updateData: any = {};

      let newEnergy = profile.currentEnergy;
      let newLastEnergyRefillAt = profile.lastEnergyRefill;

      // 2. Procesamos el array consolidado
      for (const item of syncQueues) {
        switch (item.type) {
          case 'XP':
            updateData.totalXp = { increment: item.amount };
            syncedIds.push(item.id);
            break;

          case 'COINS':
            updateData.coins = { increment: item.amount };
            syncedIds.push(item.id);
            break;

          case 'STREAK':
            updateData.streakDays = { increment: item.amount };
            syncedIds.push(item.id);
            break;

          case 'ENERGY':
            // --- LÓGICA CORE DE ENERGÍA ---
            newEnergy = profile.currentEnergy + item.amount;

            if (item.amount < 0) {
              // Gastó energía. Si antes estaba lleno, el temporizador inicia
              // en el momento exacto del gasto offline (item.createdAt)
              if (profile.currentEnergy >= profile.maxEnergy) {
                newLastEnergyRefillAt = new Date(item.createdAt);
              }
            } else if (item.amount > 0) {
              // Ganó energía offline (Refill local).
              // Avanzamos el reloj 30 min por CADA punto de energía ganado.
              if (profile.currentEnergy < profile.maxEnergy && newLastEnergyRefillAt) {
                const refillMs = item.amount * 30 * 60 * 1000;
                newLastEnergyRefillAt = new Date(newLastEnergyRefillAt.getTime() + refillMs);
              }
            }

            // Clipping de seguridad: El servidor manda. Nunca superamos el maxEnergy.
            if (newEnergy > profile.maxEnergy) {
              newEnergy = profile.maxEnergy;
            }

            // Como calculamos el valor exacto para evitar overflows, usamos set en vez de increment
            updateData.currentEnergy = newEnergy;
            updateData.lastEnergyRefill = newLastEnergyRefillAt;

            syncedIds.push(item.id);
            break;

          default:
            console.warn(`[SYNC] Tipo de métrica no soportado: ${item.type}`);
        }
      }

      // 3. Ejecutamos un único UPDATE si hay datos que guardar
      if (Object.keys(updateData).length > 0) {
        await tx.user.update({
          where: { id: userId },
          data: updateData,
        });
      }
    });

    return {
      success: true,
      syncedIds,
    };

  } catch (error) {
    console.error("[SERVER_SYNC_ERROR]", error);
    return {
      success: false,
      syncedIds: [], // Retornamos vacío para que el móvil intente de nuevo
      error: "Error procesando la cola de sincronización"
    };
  }
}