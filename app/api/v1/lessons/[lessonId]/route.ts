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
      select: { id: true, groupId: true },
    });

    if (!user) {
      return jsonError("UNAUTHORIZED", "User not found", 401);
    }

    // Get lesson with questions via many-to-many relation
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        title: true,
        description: true,
        lessonType: true,
        questions: {
          select: {
            id: true,
            questionId: true,
            orderIndex: true,
            question: {
              select: {
                id: true,
                questionText: true,
                difficulty: true,
                type: true,
                explanationText: true,
                from: true,
                course: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                answers: {
                  select: {
                    id: true,
                    answerText: true,
                    isCorrect: true,
                  },
                },
              },
            },
          },
          orderBy: { orderIndex: "asc" },
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

    // Get course info from first question if available
    const firstQuestion = lesson.questions.at(0);
    const courseId = firstQuestion ? firstQuestion.question.course.id : null;
    const courseName = firstQuestion ? firstQuestion.question.course.name : null;

     return jsonSuccess(
      {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        type: lesson.lessonType,
        courseId,
        courseName,
        questionsCount: lesson.questions.length,
        questions: lesson.questions.map((lq) => ({
          id: lq.question.id,
          text: lq.question.questionText,
          difficulty: lq.question.difficulty,
          type: lq.question.type,
          explanation: lq.question.explanationText,
          from: lq.question.from,
          orderIndex: lq.orderIndex,
          answers: lq.question.answers.map((answer) => ({
            optionId: answer.id,
            text: answer.answerText,
            isCorrect: answer.isCorrect,
          })),
        })),
        userProgress,
      },
      200
    );
  } catch (error) {
    console.error("Error fetching lesson:", error);
    return jsonError("SERVER_ERROR", "Failed to fetch lesson", 500);
  }
}


