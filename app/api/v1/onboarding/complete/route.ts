import { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

import {
  getRequestJson,
  jsonError,
  jsonSuccess,
  mapDbUserToMobile,
} from "../../_lib/mobile-auth";

/**
 * Zod schema for POST /v1/onboarding/complete
 * Validates groupId (UUID), username (min 2 chars), and birthDate (YYYY-MM-DD format)
 */
const completeOnboardingSchema = z.object({
  groupId: z.string().uuid("Invalid group ID format"),
  username: z.string().trim().min(2, "Username must be at least 2 characters"),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Birth date must be in YYYY-MM-DD format"),
});

/**
 * POST /v1/onboarding/complete
 * Finaliza el onboarding: guarda grupo, username y fecha de nacimiento del usuario.
 * Requiere sesión autenticada.
 */
export async function POST(request: NextRequest) {
  // Verify user is authenticated
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return jsonError("UNAUTHORIZED", "Session not found", 401);
  }

  // Parse and validate request body
  const rawBody = await getRequestJson<unknown>(request);
  const parsed = completeOnboardingSchema.safeParse(rawBody);

  if (!parsed.success) {
    return jsonError("VALIDATION_ERROR", "Invalid onboarding data", 422);
  }

  const { groupId, username, birthDate } = parsed.data;

  try {
    // Verify group exists
    const groupExists = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!groupExists) {
      return jsonError("NOT_FOUND", "Group not found", 404);
    }

    // Update user with group and username
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name: username,
        groupId: groupId,
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        name: true,
        groupId: true,
        isDisabled: true,
      },
    });

    // Store birthDate in UserProfile
    await prisma.userProfile.upsert({
      where: { userId: updatedUser.id },
      update: { birthDate },
      create: { userId: updatedUser.id, birthDate },
    });

    return jsonSuccess(
      {
        completed: true,
        user: mapDbUserToMobile(updatedUser),
      },
      200
    );
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return jsonError("SERVER_ERROR", "Failed to complete onboarding", 500);
  }
}


