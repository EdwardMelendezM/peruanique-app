import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { jsonError, jsonSuccess } from "../../_lib/mobile-auth";

/**
 * GET /v1/profile/stats
 * Devuelve estadísticas principales del usuario:
 * - completedLessons: COUNT de UserProgress con status COMPLETED
 * - points: User.totalXp
 * - coins: SUM de RewardEvent.pointsDelta
 * - streakDays: User.streakDays
 * - level: floor(totalXp / 1000) + 1
 * Requiere autenticación.
 */
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return jsonError("UNAUTHORIZED", "Session not found", 401);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        totalXp: true,
        streakDays: true,
      },
    });

    if (!user) {
      return jsonError("UNAUTHORIZED", "User not found", 401);
    }

    // Count completed lessons
    const completedLessons = await prisma.userProgress.count({
      where: {
        userId: user.id,
        status: "COMPLETED",
      },
    });

    // Calculate coins (sum of reward events)
    const rewardEvents = await prisma.rewardEvent.findMany({
      where: { userId: user.id },
      select: { pointsDelta: true },
    });

    const coins = rewardEvents.reduce((sum, event) => sum + event.pointsDelta, 0);

    // Calculate level
    const level = Math.floor(user.totalXp / 1000) + 1;

    return jsonSuccess(
      {
        completedLessons,
        points: user.totalXp,
        coins,
        streakDays: user.streakDays,
        level,
      },
      200
    );
  } catch (error) {
    console.error("Error fetching profile stats:", error);
    return jsonError("SERVER_ERROR", "Failed to fetch profile stats", 500);
  }
}
