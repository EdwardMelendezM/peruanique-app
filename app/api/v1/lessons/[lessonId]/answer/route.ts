import { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getRequestJson, jsonError, jsonSuccess } from "../../../_lib/mobile-auth";
import { calculateXpDelta, findRoadmapNode } from "../../_lib/lesson-helpers";

/**
 * Zod schema for POST /v1/lessons/:lessonId/answer
 * Validates questionId, selectedOptionId, and timeSpentSeconds
 */
const answerLessonSchema = z.object({
  questionId: z.string().uuid("Invalid question ID"),
  selectedOptionId: z.string().uuid("Invalid option ID"),
  timeSpentSeconds: z
    .number()
    .int()
    .min(0, "Time cannot be negative")
    .max(3600, "Time cannot exceed 1 hour"),
});


/**
 * POST /v1/lessons/:lessonId/answer
 * Registra la respuesta del usuario a una pregunta.
 * Calcula XP, actualiza UserProgress y genera RewardEvent.
 * Requiere autenticación.
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
    const parsed = answerLessonSchema.safeParse(rawBody);

    if (!parsed.success) {
      return jsonError("VALIDATION_ERROR", "Invalid answer data", 422);
    }

    const { questionId, selectedOptionId, timeSpentSeconds } = parsed.data;

    // Get authenticated user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, totalXp: true, groupId: true },
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

    // Find RoadmapNode for this lesson (needed to track progress)
    const roadmapNode = await findRoadmapNode(lessonId, user.id);

    // Calculate XP delta
    const xpDelta = calculateXpDelta(question.difficulty, selectedAnswer.isCorrect);

    // Create LessonAttempt
    const attempt = await prisma.lessonAttempt.create({
      data: {
        userId: user.id,
        nodeId: roadmapNode?.id,
        questionId,
        selectedAnswerId: selectedOptionId,
        isCorrect: selectedAnswer.isCorrect,
        timeSeconds: timeSpentSeconds,
      },
      select: {
        id: true,
      },
    });

    // If correct answer, update UserProgress
    if (roadmapNode) {
      const totalQuestions = await prisma.lessonQuestion.count({
        where: { lessonId },
      });

      // Check if all questions have been answered (correctness doesn't matter for completion)
      const distinctQuestionsAnswered = await prisma.lessonAttempt.groupBy({
        by: ['questionId'],
        where: {
          userId: user.id,
          nodeId: roadmapNode.id,
        },
      });

      const isLessonCompleted = distinctQuestionsAnswered.length === totalQuestions;

      // Actualizar o Crear el progreso
      await prisma.userProgress.upsert({
        where: {
          userId_nodeId: { userId: user.id, nodeId: roadmapNode.id },
        },
        update: {
          scoreObtained: { increment: xpDelta },
          // Solo incrementamos estrellas o lógica de gamificación si fue correcta
          starsEarned: selectedAnswer.isCorrect ? { increment: 1 } : undefined,
          status: isLessonCompleted ? "COMPLETED" : "IN_PROGRESS",
        },
        create: {
          userId: user.id,
          nodeId: roadmapNode.id,
          scoreObtained: xpDelta,
          starsEarned: selectedAnswer.isCorrect ? 1 : 0,
          status: isLessonCompleted ? "COMPLETED" : "IN_PROGRESS",
        },
      });
    }

    // Update User totalXp
    await prisma.user.update({
      where: { id: user.id },
      data: {
        totalXp: {
          increment: xpDelta,
        },
      },
    });

    // Create RewardEvent to track the reward
    await prisma.rewardEvent.create({
      data: {
        userId: user.id,
        type: "LESSON_COMPLETED",
        pointsDelta: xpDelta,
      },
    });

    // Get the correct answer to show to the user
    const correctAnswer = await prisma.answer.findFirst({
      where: {
        questionId,
        isCorrect: true,
      },
      select: { id: true },
    });

    return jsonSuccess(
      {
        attemptId: attempt.id,
        isCorrect: selectedAnswer.isCorrect,
        correctOptionId: correctAnswer?.id,
        xpDelta,
        showInsight: !selectedAnswer.isCorrect,
        explanation: !selectedAnswer.isCorrect ? question.explanationText : undefined,
      },
      200
    );
  } catch (error) {
    console.error("Error submitting answer:", error);
    return jsonError("SERVER_ERROR", "Failed to submit answer", 500);
  }
}

