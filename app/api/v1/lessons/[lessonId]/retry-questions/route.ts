import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { jsonError, jsonSuccess } from "../../../_lib/mobile-auth";
import { getProgressStatus, getAllLessonQuestions } from "../../_lib/lesson-helpers";

/**
 * GET /v1/lessons/:lessonId/retry-questions
 * Devuelve TODAS las preguntas de una lección completada para modo retry/práctica.
 * A diferencia de /question, no aplica filtros de "ya respondidas".
 * Requiere autenticación y que la lección esté COMPLETED.
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

    if (!user || !user?.groupId) {
      return jsonError("UNAUTHORIZED", "User not found", 401);
    }

    // Verify lesson exists
    const lessonExists = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lessonExists) {
      return jsonError("NOT_FOUND", "Lesson not found", 404);
    }

    // Find RoadmapNode for this lesson
    const roadmapNode = await prisma.roadmapNode.findFirst({
      where: { lessonId, groupId: user.groupId },
    });

    if (!roadmapNode) {
      return jsonError("NOT_FOUND", "Lesson not found in roadmap", 404);
    }

    // ⚠️ CRITICAL: Verify that lesson is COMPLETED before returning all questions
    const progressStatus = await getProgressStatus(roadmapNode.id, user.id);

    if (progressStatus !== "COMPLETED") {
      return jsonError(
        "VALIDATION_ERROR",
        "Lesson must be completed before accessing retry questions. Use /question endpoint instead.",
        422
      );
    }

    // Get all questions for this lesson (no filters)
    const allQuestions = await getAllLessonQuestions(lessonId);

    if (allQuestions.length === 0) {
      return jsonError(
        "NOT_FOUND",
        "No questions available for this lesson",
        404
      );
    }

    // Format response - return all questions with randomized order each time
    const questionsResponse = allQuestions.map((question) => ({
      questionId: question.id,
      prompt: question.questionText,
      difficulty: question.difficulty,
      options: question.answers.map((answer) => ({
        optionId: answer.id,
        text: answer.answerText,
      })),
      from: question.from,
    }));

    return jsonSuccess(
      {
        lessonId,
        totalQuestions: allQuestions.length,
        mode: "retry", // Indica a mobile que está en modo práctica
        questions: questionsResponse,
      },
      200
    );
  } catch (error) {
    console.error("Error fetching retry questions:", error);
    return jsonError("SERVER_ERROR", "Failed to fetch retry questions", 500);
  }
}

