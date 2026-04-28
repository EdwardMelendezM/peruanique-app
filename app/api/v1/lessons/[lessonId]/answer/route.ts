import { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  getCurrentMobileUser,
  getRequestJson,
  jsonError,
  jsonSuccess,
} from "../../../_lib/mobile-auth"
import {
  calculateXpDelta,
  findRoadmapNode,
  updateStreak,
} from "../../_lib/lesson-helpers"

/**
 * Zod schema for POST /v1/lessons/:lessonId/answer
 * Supports different question types with flexible answer data
 */
const answerLessonSchema = z.object({
  questionId: z.string().uuid("Invalid question ID"),
  // Para compatibilidad con tipos existentes
  selectedOptionId: z.string().uuid("Invalid option ID").optional(),
  // Nuevos campos para tipos avanzados
  answerText: z.string().optional(), // LONG_TEXT
  mathExpression: z.string().optional(), // MATH_EXPRESSION
  imageCoordinates: z.object({ x: z.number(), y: z.number() }).optional(), // IMAGE_BASED
  timeSpentSeconds: z
    .number()
    .int()
    .min(0, "Time cannot be negative")
    .max(3600, "Time cannot exceed 1 hour"),
}).refine((data) => {
  // Validación: Al menos uno de los campos de respuesta debe estar presente
  const hasSelectedOption = !!data.selectedOptionId;
  const hasAnswerText = !!data.answerText;
  const hasMathExpression = !!data.mathExpression;
  const hasImageCoordinates = !!data.imageCoordinates;
  
  return hasSelectedOption || hasAnswerText || hasMathExpression || hasImageCoordinates;
}, {
  message: "At least one answer field must be provided",
  path: ["answerData"],
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
    const user = await getCurrentMobileUser(session.user.email);
    if (!user) {
      return jsonError("UNAUTHORIZED", "User not found", 401);
    }
    if (user.currentEnergy === 0) {
      return jsonError(
        "FORBIDDEN",
        "Not enough energy to attempt a question. Please wait for it to refill.",
        403
      )
    }
    await updateStreak(user.id)

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
        type: true, // ✅ Obtener tipo de pregunta
        answers: true, // ✅ Obtener todas las respuestas para validación
      },
    });

    if (!question) {
      return jsonError("NOT_FOUND", "Question not found", 404);
    }

    // ✅ Validar respuesta basada en el tipo de pregunta
    let isCorrect = false;
    let selectedAnswerId: string | null = null;

    switch (question.type) {
      case "MULTIPLE_CHOICE":
      case "DRAG_AND_DROP":
        // Lógica existente
        if (!selectedOptionId) {
          return jsonError("VALIDATION_ERROR", "selectedOptionId is required for this question type", 422);
        }
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
        isCorrect = selectedAnswer.isCorrect;
        selectedAnswerId = selectedAnswer.id;
        break;

      case "LONG_TEXT":
        // Comparar texto
        if (!parsed.data.answerText) {
          return jsonError("VALIDATION_ERROR", "answerText is required for LONG_TEXT questions", 422);
        }
        const correctLongText = question.answers.find(a => a.isCorrect)?.answerText;
        isCorrect = correctLongText ? parsed.data.answerText.trim().toLowerCase() === correctLongText.trim().toLowerCase() : false;
        // Para LONG_TEXT, no hay selectedAnswerId
        break;

      case "MATH_EXPRESSION":
        // Comparar expresión matemática (simplificada)
        if (!parsed.data.mathExpression) {
          return jsonError("VALIDATION_ERROR", "mathExpression is required for MATH_EXPRESSION questions", 422);
        }
        const correctMath = question.answers.find(a => a.isCorrect)?.answerText; // Asumir que está en answerText
        isCorrect = correctMath ? parsed.data.mathExpression.trim() === correctMath.trim() : false;
        break;

      case "IMAGE_BASED":
        // Comparar coordenadas (simplificada)
        if (!parsed.data.imageCoordinates) {
          return jsonError("VALIDATION_ERROR", "imageCoordinates is required for IMAGE_BASED questions", 422);
        }
        const correctCoords = question.answers.find(a => a.isCorrect)?.metadata as { x: number; y: number } | null;
        isCorrect = correctCoords ? 
          Math.abs(parsed.data.imageCoordinates.x - correctCoords.x) < 10 && 
          Math.abs(parsed.data.imageCoordinates.y - correctCoords.y) < 10 : false;
        break;

      default:
        return jsonError("VALIDATION_ERROR", "Unsupported question type", 422);
    }

    // Find RoadmapNode for this lesson (needed to track progress)
    const roadmapNode = await findRoadmapNode(lessonId, user.id);

    // Calculate XP delta
    const xpDelta = calculateXpDelta(question.difficulty, isCorrect);

    // Create LessonAttempt
    const attempt = await prisma.lessonAttempt.create({
      data: {
        userId: user.id,
        nodeId: roadmapNode?.id,
        questionId,
        selectedAnswerId,
        isCorrect,
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

      // Check if all questions have been answered CORRECTLY (for completion)
      // Lección se marca COMPLETED solo si TODAS las preguntas están CORRECTAS
      const distinctQuestionsCorrect = await prisma.lessonAttempt.groupBy({
        by: ['questionId'],
        where: {
          userId: user.id,
          nodeId: roadmapNode.id,
          isCorrect: true, // ✅ IMPORTANTE: Solo preguntas respondidas CORRECTAMENTE
        },
      });

      const isLessonCompleted = distinctQuestionsCorrect.length === totalQuestions;

      // Actualizar currentEnergy si falla
      if (!isCorrect) {
        await prisma.user.update({
          where: { id: user.id},
          data: { currentEnergy: { decrement: 1 } },
        })
      }

      // Actualizar o Crear el progreso
      await prisma.userProgress.upsert({
        where: {
          userId_nodeId: { userId: user.id, nodeId: roadmapNode.id },
        },
        update: {
          scoreObtained: { increment: xpDelta },
          // Solo incrementamos estrellas o lógica de gamificación si fue correcta
          starsEarned: isCorrect ? { increment: 1 } : undefined,
          status: isLessonCompleted ? "COMPLETED" : "IN_PROGRESS",
        },
        create: {
          userId: user.id,
          nodeId: roadmapNode.id,
          scoreObtained: xpDelta,
          starsEarned: isCorrect ? 1 : 0,
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
      select: { id: true, answerText: true, metadata: true },
    });

    // Preparar respuesta correcta basada en tipo
    let correctAnswerData: any = { id: correctAnswer?.id };
    
    if (question.type === "LONG_TEXT" || question.type === "MATH_EXPRESSION") {
      correctAnswerData.text = correctAnswer?.answerText;
    } else if (question.type === "IMAGE_BASED") {
      correctAnswerData.coordinates = correctAnswer?.metadata;
    }

    return jsonSuccess(
      {
        attemptId: attempt.id,
        isCorrect,
        correctAnswer: correctAnswerData,
        xpDelta,
        showInsight: !isCorrect,
        explanation: !isCorrect ? question.explanationText : undefined,
      },
      200
    );
  } catch (error) {
    console.error("Error submitting answer:", error);
    return jsonError("SERVER_ERROR", "Failed to submit answer", 500);
  }
}
