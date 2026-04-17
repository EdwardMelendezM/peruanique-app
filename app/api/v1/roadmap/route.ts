import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { jsonError, jsonSuccess } from "../_lib/mobile-auth";

/**
 * GET /v1/roadmap?groupId=...
 * Devuelve el roadmap del grupo con progreso del usuario.
 * Requiere autenticación.
 */
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return jsonError("UNAUTHORIZED", "Session not found", 401);
  }

  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");

    if (!groupId) {
      return jsonError(
        "VALIDATION_ERROR",
        "groupId parameter is required",
        422
      );
    }

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

    // Verify group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    if (!group) {
      return jsonError("NOT_FOUND", "Group not found", 404);
    }

    // Get coins from reward events
    const rewardEvents = await prisma.rewardEvent.findMany({
      where: { userId: user.id },
      select: { pointsDelta: true },
    });
    const coins = rewardEvents.reduce((sum, event) => sum + event.pointsDelta, 0);

    // Count completed lessons
    const completedLessons = await prisma.userProgress.count({
      where: {
        userId: user.id,
        status: "COMPLETED",
      },
    });

    // Get roadmap nodes
    const roadmapNodes = await prisma.roadmapNode.findMany({
      where: { groupId },
      select: {
        id: true,
        lessonId: true,
        orderIndex: true,
        lesson: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { orderIndex: "asc" },
    });

    // Get user progress for each node
    const nodes = await Promise.all(
      roadmapNodes.map(async (node) => {
        const progress = await prisma.userProgress.findUnique({
          where: {
            userId_nodeId: {
              userId: user.id,
              nodeId: node.id,
            },
          },
          select: {
            status: true,
            scoreObtained: true,
          },
        });

        return {
          id: node.id,
          lessonId: node.lessonId,
          lessonTitle: node.lesson.title,
          status: progress?.status || "LOCKED",
          orderIndex: node.orderIndex,
          progressPercent: progress ? Math.min((progress.scoreObtained / 100) * 100, 100) : 0,
        };
      })
    );

    return jsonSuccess(
      {
        group,
        summary: {
          points: user.totalXp,
          coins,
          streakDays: user.streakDays,
          completedLessons,
        },
        nodes,
      },
      200
    );
  } catch (error) {
    console.error("Error fetching roadmap:", error);
    return jsonError("SERVER_ERROR", "Failed to fetch roadmap", 500);
  }
}
