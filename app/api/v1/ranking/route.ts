import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { jsonError, jsonSuccess } from "../_lib/mobile-auth";

/**
 * GET /v1/ranking?groupId=...&period=daily
 * Devuelve el ranking de usuarios por XP (totalXp).
 * Soporta filtrado por grupo y período.
 * Requiere autenticación.
 */
export async function GET(request: NextRequest) {
  // Verify user is authenticated
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return jsonError("UNAUTHORIZED", "Session not found", 401);
  }

  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId") || undefined;
    const period = searchParams.get("period") || "daily";

    // Validate period
    if (!["daily", "weekly", "all"].includes(period)) {
      return jsonError("VALIDATION_ERROR", "Invalid period", 422);
    }

    // Calculate date filter based on period
    let dateFilter: Date | undefined;
    const now = new Date();

    if (period === "daily") {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      dateFilter = startOfDay;
    } else if (period === "weekly") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      dateFilter = startOfWeek;
    }
    // For "all", no date filter

    // If groupId provided, verify it exists
    if (groupId) {
      const groupExists = await prisma.group.findUnique({
        where: { id: groupId },
      });

      if (!groupExists) {
        return jsonError("NOT_FOUND", "Group not found", 404);
      }
    }

    // Query users for ranking
    const rankingQuery = {
      where: groupId ? { groupId: groupId } : {},
      select: {
        id: true,
        name: true,
        totalXp: true,
        streakDays: true,
      },
      orderBy: {
        totalXp: "desc" as const,
      },
    };

    const users = await prisma.user.findMany(rankingQuery);

    // Filter by date if needed (based on RewardEvent createdAt)
    let filteredUsers = users;

    if (dateFilter && period !== "all") {
      // Get user IDs with recent reward events
      const recentRewards = await prisma.rewardEvent.findMany({
        where: {
          createdAt: {
            gte: dateFilter,
          },
        },
        select: {
          userId: true,
        },
        distinct: ["userId"],
      });

      const recentUserIds = new Set(recentRewards.map((r) => r.userId));
      filteredUsers = users.filter((u) => recentUserIds.has(u.id));
    }

    // Add position to each user
    const items = filteredUsers.map((user, index) => ({
      position: index + 1,
      userId: user.id,
      username: user.name || "Anonymous",
      points: user.totalXp,
      streakDays: user.streakDays,
    }));

    return jsonSuccess(
      {
        period,
        groupId: groupId || null,
        items,
      },
      200
    );
  } catch (error) {
    console.error("Error fetching ranking:", error);
    return jsonError("SERVER_ERROR", "Failed to fetch ranking", 500);
  }
}
