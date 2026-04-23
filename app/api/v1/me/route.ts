import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

import {
  getRequestJson,
  jsonError,
  jsonSuccess,
  mapDbUserToMobile,
  updateMeBodySchema,
} from "../_lib/mobile-auth";

const ENERGY_REFILL_RATE_MINUTES = 30;

export async function GET(request: NextRequest) {
  const user = await loadCurrentUser(request);

  if (!user) {
    return jsonError("UNAUTHORIZED", "Session not found", 401);
  }

  // Ahora 'user' ya trae la propiedad energy calculada
  return jsonSuccess(mapDbUserToMobile(user), 200);
}

export async function PATCH(request: NextRequest) {
  const user = await loadCurrentUser(request);

  if (!user) {
    return jsonError("UNAUTHORIZED", "Session not found", 401);
  }

  const rawBody = await getRequestJson<unknown>(request);
  const parsed = updateMeBodySchema.safeParse(rawBody);

  if (!parsed.success) {
    return jsonError("VALIDATION_ERROR", "Invalid profile data", 422);
  }

  const updatedUser = await prisma.user.update({
    where: { email: user.email },
    data: {
      ...(parsed.data.username !== undefined ? { name: parsed.data.username } : {}),
      ...(parsed.data.fullName !== undefined ? { full_name: parsed.data.fullName } : {}),
      ...(parsed.data.groupId !== undefined ? { groupId: parsed.data.groupId } : {}),
    },
    select: {
      id: true,
      email: true,
      full_name: true,
      name: true,
      groupId: true,
      isDisabled: true,
    },
  });

  return jsonSuccess(
    {
      updated: true,
      user: mapDbUserToMobile(updatedUser),
    },
    200
  );
}

async function syncUserEnergy(userId: string, currentEnergy: number, maxEnergy: number, lastRefill: Date) {
  const now = new Date();
  const msPassed = now.getTime() - lastRefill.getTime();
  const minutesPassed = Math.floor(msPassed / (1000 * 60));

  if (minutesPassed >= ENERGY_REFILL_RATE_MINUTES && currentEnergy < maxEnergy) {
    const energyToRecover = Math.floor(minutesPassed / ENERGY_REFILL_RATE_MINUTES);
    const newEnergy = Math.min(maxEnergy, currentEnergy + energyToRecover);

    // Calculamos el sobrante de tiempo para no perder segundos en el siguiente ciclo
    const leftoverMs = msPassed % (ENERGY_REFILL_RATE_MINUTES * 60 * 1000);
    const newRefillDate = new Date(now.getTime() - leftoverMs);

    return prisma.user.update({
      where: { id: userId },
      data: {
        currentEnergy: newEnergy,
        lastEnergyRefill: newRefillDate,
      },
    })
  }

  return null; // No hubo cambios
}

const loadCurrentUser = async (request: NextRequest) => {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return null;

  const userData = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      full_name: true,
      name: true,
      group: true,
      isDisabled: true,
      // Nuevos campos necesarios para la lógica
      currentEnergy: true,
      maxEnergy: true,
      lastEnergyRefill: true,
    },
  });

  if (!userData) return null;

  // --- LÓGICA DE ENERGÍA ---
  const updatedUser = await syncUserEnergy(
    userData.id,
    userData.currentEnergy,
    userData.maxEnergy,
    userData.lastEnergyRefill
  );

  // Usamos los datos actualizados si hubo recarga, sino los originales
  const finalEnergy = updatedUser ? updatedUser.currentEnergy : userData.currentEnergy;
  const finalRefill = updatedUser ? updatedUser.lastEnergyRefill : userData.lastEnergyRefill;

  // Calculamos segundos para el siguiente punto (para el mobile)
  const msSinceLast = new Date().getTime() - finalRefill.getTime();
  const msToNext = (ENERGY_REFILL_RATE_MINUTES * 60 * 1000) - msSinceLast;
  const nextRefillInSeconds = finalEnergy >= userData.maxEnergy ? 0 : Math.max(0, Math.floor(msToNext / 1000));

  return {
    id: userData.id,
    email: userData.email,
    full_name: userData.full_name,
    name: userData.name,
    group: userData?.group || undefined,
    isDisabled: userData.isDisabled,
    // Devolvemos el objeto de energía formateado
    energy: {
      current: finalEnergy,
      max: userData.maxEnergy,
      nextRefillInSeconds,
    }
  };
};
