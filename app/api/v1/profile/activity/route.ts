import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { jsonError, jsonSuccess } from "../../_lib/mobile-auth";

/**
 * GET /v1/profile/activity
 * Devuelve historial de actividad reciente del usuario.
 * Tipos: lesson_completed, streak_reached, level_up, daily_goal
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
      select: { id: true },
    });

    if (!user) {
      return jsonError("UNAUTHORIZED", "User not found", 401);
    }

    // Get reward events
    const rewardEvents = await prisma.rewardEvent.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        type: true,
        pointsDelta: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Get lesson completions
    const completedLessons = await prisma.userProgress.findMany({
      where: {
        userId: user.id,
        status: "COMPLETED",
      },
      select: {
        node: {
          select: {
            lesson: {
              select: {
                title: true,
              },
            },
          },
        },
        starsEarned: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });

    // Build activity items
    const items: Array<{
      type: string;
      title: string;
      subtitle?: string;
      createdAt: string;
    }> = [];

    // Add reward events
    for (const event of rewardEvents) {
      let type = event.type.toLowerCase();
      let title = "";
      let subtitle = "";

      if (event.type === "LESSON_COMPLETED") {
        type = "lesson_completed";
        title = "Lección completada";
        subtitle = `+${event.pointsDelta} XP`;
      } else if (event.type === "STREAK") {
        type = "streak_reached";
        title = "Racha mantenida";
        subtitle = `+${event.pointsDelta} XP`;
      } else if (event.type === "DAILY_GOAL") {
        type = "daily_goal";
        title = "Meta diaria completada";
        subtitle = `+${event.pointsDelta} XP`;
      }

      if (title) {
        items.push({
          type,
          title,
          subtitle: subtitle || undefined,
          createdAt: event.createdAt.toISOString(),
        });
      }
    }

    // Add lesson completions
    for (const progress of completedLessons) {
      const lessonTitle = progress.node.lesson.title;
      const starsEarned = progress.starsEarned || 0;

      items.push({
        type: "lesson_completed",
        title: `Completaste: ${lessonTitle}`,
        subtitle: `${starsEarned} estrellas ganadas`,
        createdAt: progress.updatedAt.toISOString(),
      });
    }

    // Sort by createdAt descending
    items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Remove duplicates and limit to 20
    const uniqueItems = Array.from(
      new Map(items.map((item) => [item.title, item])).values()
    );

    return jsonSuccess(
      {
        items: uniqueItems.slice(0, 20),
      },
      200
    );
  } catch (error) {
    console.error("Error fetching profile activity:", error);
    return jsonError("SERVER_ERROR", "Failed to fetch profile activity", 500);
  }
}
