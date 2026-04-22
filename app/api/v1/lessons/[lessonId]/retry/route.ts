import { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getRequestJson, jsonError, jsonSuccess } from "../../../_lib/mobile-auth";
import { findRoadmapNode, getProgressStatus } from "../../_lib/lesson-helpers";

/**
 * Zod schema for POST /v1/lessons/:lessonId/retry
 * Valida questionId, selectedOptionId, y timeSpentSeconds
 * Mismo payload que el endpoint answer
 */
const retryLessonSchema = z.object({
  questionId: z.string().uuid("Invalid question ID"),
  selectedOptionId: z.string().uuid("Invalid option ID"),
  timeSpentSeconds: z
    .number()
    .int()
    .min(0, "Time cannot be negative")
    .max(3600, "Time cannot exceed 1 hour"),
});

/**
 * POST /v1/lessons/:lessonId/retry
 * Permite al usuario responder preguntas de una lección completada para practicar.
 * NO suma XP, NO actualiza UserProgress, solo registra LessonAttempt.
 * Requiere autenticación y que la lección esté COMPLETED.
 */
export async function POST(
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

    // Get and validate request body
    const rawBody = await getRequestJson<unknown>(request);
    const parsed = retryLessonSchema.safeParse(rawBody);

    if (!parsed.success) {
      return jsonError("VALIDATION_ERROR", "Invalid answer data", 422);
    }

    const { questionId, selectedOptionId, timeSpentSeconds } = parsed.data;

    // Get authenticated user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, groupId: true },
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

    // Verify question exists and belongs to this lesson (through LessonQuestion)
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        difficulty: true,
        explanationText: true,
      },
    });

    if (!question) {
      return jsonError("NOT_FOUND", "Question not found", 404);
    }

    // Verify the question belongs to this lesson through LessonQuestion
    const lessonQuestion = await prisma.lessonQuestion.findUnique({
      where: {
        lessonId_questionId: {
          lessonId,
          questionId,
        },
      },
    });

    if (!lessonQuestion) {
      return jsonError("NOT_FOUND", "Question not found in this lesson", 404);
    }

    // Verify selected option exists and belongs to this question
    const selectedAnswer = await prisma.answer.findUnique({
      where: { id: selectedOptionId },
      select: {
        id: true,
        questionId: true,
        isCorrect: true,
      },
    });

    if (!selectedAnswer || selectedAnswer.questionId !== questionId) {
      return jsonError("NOT_FOUND", "Answer option not found", 404);
    }

    // Find RoadmapNode for this lesson
    const roadmapNode = await findRoadmapNode(lessonId, user.id);

    if (!roadmapNode) {
      return jsonError("NOT_FOUND", "Lesson not found in roadmap", 404);
    }

    // ⚠️ CRITICAL: Verify that lesson is COMPLETED before allowing retry
    const progressStatus = await getProgressStatus(roadmapNode.id, user.id);

    if (progressStatus !== "COMPLETED") {
      return jsonError(
        "VALIDATION_ERROR",
        "Lesson must be completed before retrying. Use /answer endpoint instead.",
        422
      );
    }

    // ✅ Create LessonAttempt - same as /answer
    const attempt = await prisma.lessonAttempt.create({
      data: {
        userId: user.id,
        nodeId: roadmapNode.id,
        questionId,
        selectedAnswerId: selectedOptionId,
        isCorrect: selectedAnswer.isCorrect,
        timeSeconds: timeSpentSeconds,
      },
      select: {
        id: true,
      },
    });

    // ❌ DO NOT update UserProgress
    // ❌ DO NOT update User.totalXp
    // ❌ DO NOT create RewardEvent

    // Get the correct answer to show to the user
    const correctAnswer = await prisma.answer.findFirst({
      where: {
        questionId,
        isCorrect: true,
      },
      select: { id: true },
    });

    // ✅ Return response with xpDelta = 0 and isRetry = true
    return jsonSuccess(
      {
        attemptId: attempt.id,
        isCorrect: selectedAnswer.isCorrect,
        correctOptionId: correctAnswer?.id,
        xpDelta: 0, // NO XP awarded in retry mode
        isRetry: true, // Flag para que mobile sepa que es un reintento
        showInsight: !selectedAnswer.isCorrect,
        explanation: !selectedAnswer.isCorrect ? question.explanationText : undefined,
      },
      200
    );
  } catch (error) {
    console.error("Error submitting retry answer:", error);
    return jsonError("SERVER_ERROR", "Failed to submit retry answer", 500);
  }
}

