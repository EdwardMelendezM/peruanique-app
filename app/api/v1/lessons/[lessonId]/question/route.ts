import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { jsonError, jsonSuccess } from "../../../_lib/mobile-auth";
import { getNextQuestion, isLessonUnlocked } from "../../_lib/lesson-helpers";

/**
 * GET /v1/lessons/:lessonId/question
 * Devuelve la siguiente pregunta disponible para la lección.
 * Prioriza preguntas no respondidas, luego preguntas respondidas incorrectamente.
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
    const lessonExists = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lessonExists) {
      return jsonError("NOT_FOUND", "Lesson not found", 404);
    }

    // ✅ SECURITY: Validate that lesson is unlocked for this user
    const isUnlocked = await isLessonUnlocked(lessonId, user.id);
    if (!isUnlocked) {
      return jsonError(
        "VALIDATION_ERROR",
        "Lesson is not unlocked yet. Complete the previous lesson first.",
        422
      );
    }

    // Get next question for this user
    const nextQuestion = await getNextQuestion(lessonId, user.id);

    if (!nextQuestion) {
      return jsonError(
        "NOT_FOUND",
        "No questions available for this lesson",
        404
      );
    }

    // Count total questions in this lesson
    const totalQuestions = await prisma.lessonQuestion.count({
      where: { lessonId },
    });

    // Get all question IDs in this lesson
    const lessonQuestions = await prisma.lessonQuestion.findMany({
      where: { lessonId },
      select: { questionId: true },
    });

    const questionIds = lessonQuestions.map((lq) => lq.questionId);

    // Count distinct questions answered correctly by the user
    const correctAttempts = await prisma.lessonAttempt.findMany({
      where: {
        userId: user.id,
        questionId: {
          in: questionIds,
        },
        isCorrect: true,
      },
      select: { questionId: true },
      distinct: ["questionId"],
    });

    const answeredCorrectly = correctAttempts.length;
    const pendingQuestions = totalQuestions - answeredCorrectly;

    // Format response
    return jsonSuccess(
      {
        questionId: nextQuestion.id,
        prompt: nextQuestion.questionText,
        difficulty: nextQuestion.difficulty,
        options: nextQuestion.answers.map((answer ) => ({
          optionId: answer.id,
          text: answer.answerText,
        })),
        from: nextQuestion.from,
        totalQuestions,
        answeredCorrectly,
        pendingQuestions,
      },
      200
    );
  } catch (error) {
    console.error("Error fetching question:", error);
    return jsonError("SERVER_ERROR", "Failed to fetch question", 500);
  }
}

