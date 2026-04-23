import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";

import {
  copySetCookies,
  forwardAuthRequest,
  getRequestJson,
  getSetCookies,
  jsonError,
  jsonSuccess,
  mapDbUserToMobile,
  mapStatusToErrorCode,
  parseAuthJson,
  registerBodySchema,
  sevenDaysFromNow,
  toCookieHeader,
} from "../../_lib/mobile-auth";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const rawBody = await getRequestJson<unknown>(request);
  const parsed = registerBodySchema.safeParse(rawBody);

  if (!parsed.success) {
    return jsonError("VALIDATION_ERROR", "Invalid registration data", 422);
  }

  const authResponse = await forwardAuthRequest(request, "/api/auth/sign-up/email", {
    email: parsed.data.email,
    password: parsed.data.password,
    name: parsed.data.fullName,
    rememberMe: true,
  });

  if (!authResponse.ok) {
    const errorPayload = await parseAuthJson<{ message?: string }>(authResponse);
    return jsonError(
      mapStatusToErrorCode(authResponse.status),
      errorPayload?.message ?? "Unable to register user",
      authResponse.status
    );
  }

  await prisma.user.update({
    where: { email: parsed.data.email },
    data: {
      name: parsed.data.username,
    },
  });

  const mobileUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: {
      id: true,
      email: true,
      full_name: true,
      name: true,
      group: true,
      isDisabled: true,
    },
  });

  if (!mobileUser) {
    return jsonError("SERVER_ERROR", "User was created but could not be loaded", 500);
  }

  const authJson = await parseAuthJson<{ token?: string | null; user?: { id: string; email: string } }>(
    authResponse
  );
  const cookieHeader = toCookieHeader(getSetCookies(authResponse));
  const sessionResult = cookieHeader
    ? await auth.api.getSession({ headers: new Headers({ cookie: cookieHeader }) })
    : null;

  const response = jsonSuccess(
    {
      user: mapDbUserToMobile(mobileUser),
      session: {
        token: sessionResult?.session.token ?? authJson?.token ?? null,
        expiresAt: sessionResult?.session.expiresAt?.toISOString() ?? sevenDaysFromNow().toISOString(),
      },
    },
    201
  );

  copySetCookies(authResponse, response);
  return response;
}

