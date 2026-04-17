import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { jsonError, jsonSuccess } from "../_lib/mobile-auth";

/**
 * GET /v1/home
 * Dashboard principal para la pantalla home.
 * Devuelve roadmap, resumen, próxima lección y actividad reciente.
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
        groupId: true,
        totalXp: true,
        streakDays: true,
      },
    });

    if (!user) {
      return jsonError("UNAUTHORIZED", "User not found", 401);
    }

    if (!user.groupId) {
      return jsonError(
        "VALIDATION_ERROR",
        "User must complete onboarding first",
        422
      );
    }

    // Get group
    const group = await prisma.group.findUnique({
      where: { id: user.groupId },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    // Get coins
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
      where: { groupId: user.groupId },
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

    // Get progress for each node
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

    // Find next lesson
    const nextNode = nodes.find(
      (n) => n.status === "IN_PROGRESS" || n.status === "LOCKED"
    );

    // Get recent activity
    const recentActivityEvents = await prisma.rewardEvent.findMany({
      where: { userId: user.id },
      select: {
        type: true,
        pointsDelta: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const recentActivity = recentActivityEvents.map((event) => ({
      type: event.type.toLowerCase(),
      title: event.type === "LESSON_COMPLETED" ? "Lección completada" : "Actividad",
      subtitle: `+${event.pointsDelta} XP`,
      createdAt: event.createdAt.toISOString(),
    }));

    // Calculate level
    const level = Math.floor(user.totalXp / 1000) + 1;

    return jsonSuccess(
      {
        roadmap: {
          group,
          nodes,
        },
        profileSummary: {
          points: user.totalXp,
          coins,
          streakDays: user.streakDays,
          completedLessons,
          level,
        },
        nextLesson: nextNode ? {
          id: nextNode.lessonId,
          title: nextNode.lessonTitle,
          status: nextNode.status,
        } : null,
        recentActivity,
      },
      200
    );
  } catch (error) {
    console.error("Error fetching home:", error);
    return jsonError("SERVER_ERROR", "Failed to fetch home", 500);
  }
}
