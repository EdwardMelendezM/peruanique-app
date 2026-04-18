import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

import {
  getRequestJson,
  jsonError,
  jsonSuccess,
  mapDbUserToMobile,
  updateMeBodySchema,
} from "../_lib/mobile-auth";

const loadCurrentUser = async (request: NextRequest) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return null;
  }

  const userData = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      full_name: true,
      name: true,
      group: true,
      isDisabled: true,
    },
  });

  if (!userData) {
    return null;
  }

  return {
    id: userData.id,
    email: userData.email,
    full_name: userData.full_name,
    name: userData.name,
    group: userData?.group ? userData?.group  : undefined,
    isDisabled: userData.isDisabled,
  }
};

export async function GET(request: NextRequest) {
  const user = await loadCurrentUser(request);

  if (!user) {
    return jsonError("UNAUTHORIZED", "Session not found", 401);
  }

  return jsonSuccess(mapDbUserToMobile(user), 200);
}

export async function PATCH(request: NextRequest) {
  const user = await loadCurrentUser(request);

  if (!user) {
    return jsonError("UNAUTHORIZED", "Session not found", 401);
  }

  const rawBody = await getRequestJson<unknown>(request);
  const parsed = updateMeBodySchema.safeParse(rawBody);

  if (!parsed.success) {
    return jsonError("VALIDATION_ERROR", "Invalid profile data", 422);
  }

  const updatedUser = await prisma.user.update({
    where: { email: user.email },
    data: {
      ...(parsed.data.username !== undefined ? { name: parsed.data.username } : {}),
      ...(parsed.data.fullName !== undefined ? { full_name: parsed.data.fullName } : {}),
      ...(parsed.data.groupId !== undefined ? { groupId: parsed.data.groupId } : {}),
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

  return jsonSuccess(
    {
      updated: true,
      user: mapDbUserToMobile(updatedUser),
    },
    200
  );
}

