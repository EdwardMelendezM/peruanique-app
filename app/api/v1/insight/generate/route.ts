import { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getRequestJson, jsonError, jsonSuccess } from "../../_lib/mobile-auth";

const generateInsightSchema = z.object({
  attemptId: z.string().uuid("Invalid attempt ID format"),
});

/**
 * POST /v1/insight/generate
 * Genera explicación IA cuando el usuario responde incorrectamente.
 * Intenta OpenAI primero, fallback a Anthropic, luego a explicación base.
 * Requiere autenticación.
 */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return jsonError("UNAUTHORIZED", "Session not found", 401);
  }

  try {
    const rawBody = await getRequestJson<unknown>(request);
    const parsed = generateInsightSchema.safeParse(rawBody);

    if (!parsed.success) {
      return jsonError("VALIDATION_ERROR", "Invalid attempt ID", 422);
    }

    const { attemptId } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return jsonError("UNAUTHORIZED", "User not found", 401);
    }

    const attempt = await prisma.lessonAttempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        userId: true,
        isCorrect: true,
        question: {
          select: {
            questionText: true,
            explanationText: true,
            answers: {
              where: { isCorrect: true },
              select: { answerText: true },
            },
          },
        },
      },
    });

    if (!attempt) {
      return jsonError("NOT_FOUND", "Attempt not found", 404);
    }

    if (attempt.userId !== user.id) {
      return jsonError("FORBIDDEN", "Cannot access this attempt", 403);
    }

    if (attempt.isCorrect) {
      return jsonError(
        "VALIDATION_ERROR",
        "Insights only available for incorrect answers",
        422
      );
    }

    const questionText = attempt.question.questionText;
    const correctAnswer = attempt.question.answers[0]?.answerText || "Unknown";
    const baseExplanation = attempt.question.explanationText;

    let aiResult = await generateOpenAIExplanation(questionText, correctAnswer);

    if (!aiResult) {
      aiResult = await generateAnthropicExplanation(questionText, correctAnswer);
    }

    if (!aiResult) {
      if (!baseExplanation) {
        return jsonError("SERVER_ERROR", "No explanation available", 500);
      }

      return jsonSuccess(
        {
          fallback: true,
          explanation: baseExplanation,
        },
        200
      );
    }

    await prisma.aiExplanation.create({
      data: {
        attemptId,
        content: aiResult,
      },
    });

    return jsonSuccess(aiResult, 200);
  } catch (error) {
    console.error("Error generating insight:", error);
    return jsonError("SERVER_ERROR", "Failed to generate insight", 500);
  }
}

async function generateOpenAIExplanation(
  questionText: string,
  correctAnswer: string
) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are an expert tutor. Explain concepts clearly and pedagogically. Respond in JSON format: { title: string, body: string, formulaLatex?: string, highlight?: string }",
          },
          {
            role: "user",
            content: `Explain why "${correctAnswer}" is the correct answer to: "${questionText}". Provide structured explanation.`,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);

    return {
      provider: "openai",
      model: "gpt-4",
      content: [content],
    };
  } catch (error) {
    return null;
  }
}

async function generateAnthropicExplanation(
  questionText: string,
  correctAnswer: string
) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: `Explain why "${correctAnswer}" is the correct answer to: "${questionText}". Respond in JSON format: { title: string, body: string, formulaLatex?: string, highlight?: string }`,
          },
        ],
        system:
          "You are an expert tutor. Explain concepts clearly and pedagogically.",
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const content = JSON.parse(data.content[0].text);

    return {
      provider: "anthropic",
      model: "claude-3-sonnet",
      content: [content],
    };
  } catch (error) {
    return null;
  }
}
