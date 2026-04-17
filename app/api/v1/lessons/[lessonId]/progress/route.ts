import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { jsonError, jsonSuccess } from "../../../_lib/mobile-auth";
import {
  findRoadmapNode,
  countCompletedQuestions,
  getTotalQuestions,
} from "../../_lib/lesson-helpers";

/**
 * GET /v1/lessons/:lessonId/progress
 * Devuelve el progreso del usuario en una lección específica.
 * Incluye status, score, estrellas y conteo de preguntas.
 * Requiere autenticación.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  // Verify user is authenticated
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return jsonError("UNAUTHORIZED", "Session not found", 401);
  }

  try {
    const { lessonId } = await params;

    // Get authenticated user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return jsonError("UNAUTHORIZED", "User not found", 401);
    }

    // Verify lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      return jsonError("NOT_FOUND", "Lesson not found", 404);
    }

    // Find RoadmapNode for this lesson
    const roadmapNode = await findRoadmapNode(lessonId, user.id);

    if (!roadmapNode) {
      return jsonError(
        "NOT_FOUND",
        "Lesson not found in your roadmap",
        404
      );
    }

    // Get UserProgress
    const userProgress = await prisma.userProgress.findUnique({
      where: {
        userId_nodeId: {
          userId: user.id,
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
      // Return default progress if no record exists
      return jsonSuccess(
        {
          status: "LOCKED",
          score: 0,
          starsEarned: 0,
          completedQuestions: 0,
          totalQuestions: await getTotalQuestions(lessonId),
        },
        200
      );
    }

    // Count completed and total questions
    const completedQuestions = await countCompletedQuestions(lessonId, user.id);
    const totalQuestions = await getTotalQuestions(lessonId);

    return jsonSuccess(
      {
        status: userProgress.status,
        score: userProgress.scoreObtained,
        starsEarned: userProgress.starsEarned,
        completedQuestions,
        totalQuestions,
      },
      200
    );
  } catch (error) {
    console.error("Error fetching lesson progress:", error);
    return jsonError("SERVER_ERROR", "Failed to fetch lesson progress", 500);
  }
}

