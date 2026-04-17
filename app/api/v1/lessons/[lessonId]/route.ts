import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { jsonError, jsonSuccess } from "../../_lib/mobile-auth";

/**
 * GET /v1/lessons/:lessonId
 * Devuelve la información completa de una lección incluyendo el progreso del usuario.
 * Requiere autenticación.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  // Verify user is authenticated
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return jsonError("UNAUTHORIZED", "Session not found", 401);
  }

  try {
    const { lessonId } = params;

    // Get authenticated user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, groupId: true },
    });

    if (!user) {
      return jsonError("UNAUTHORIZED", "User not found", 401);
    }

    // Get lesson with course information
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        title: true,
        description: true,
        courseId: true,
        course: {
          select: {
            id: true,
            name: true,
          },
        },
        questions: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!lesson) {
      return jsonError("NOT_FOUND", "Lesson not found", 404);
    }

    // Get user's progress in this lesson (via RoadmapNode)
    let userProgress = null;
    if (user.groupId) {
      const roadmapNode = await prisma.roadmapNode.findFirst({
        where: {
          lessonId,
          groupId: user.groupId,
        },
        select: { id: true },
      });

      if (roadmapNode) {
        userProgress = await prisma.userProgress.findUnique({
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
      }
    }

    // Default if no progress found
    if (!userProgress) {
      userProgress = {
        status: "LOCKED" as const,
        scoreObtained: 0,
        starsEarned: 0,
      };
    }

    return jsonSuccess(
      {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        courseId: lesson.course.id,
        courseName: lesson.course.name,
        questionsCount: lesson.questions.length,
        userProgress,
      },
      200
    );
  } catch (error) {
    console.error("Error fetching lesson:", error);
    return jsonError("SERVER_ERROR", "Failed to fetch lesson", 500);
  }
}


