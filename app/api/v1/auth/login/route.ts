import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

import {
  copySetCookies,
  forwardAuthRequest,
  getRequestJson,
  getSetCookies,
  jsonError,
  jsonSuccess,
  loginBodySchema,
  mapDbUserToMobile,
  mapStatusToErrorCode,
  parseAuthJson,
  sevenDaysFromNow,
  toCookieHeader,
} from "../../_lib/mobile-auth";

export async function POST(request: NextRequest) {
  const rawBody = await getRequestJson<unknown>(request);
  const parsed = loginBodySchema.safeParse(rawBody);

  if (!parsed.success) {
    return jsonError("VALIDATION_ERROR", "Invalid login data", 422);
  }

  const authResponse = await forwardAuthRequest(request, "/api/auth/sign-in/email", {
    email: parsed.data.email,
    password: parsed.data.password,
    rememberMe: true,
  });

  if (!authResponse.ok) {
    const errorPayload = await parseAuthJson<{ message?: string }>(authResponse);
    return jsonError(
      mapStatusToErrorCode(authResponse.status),
      errorPayload?.message ?? "Unable to sign in",
      authResponse.status
    );
  }

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
    return jsonError("NOT_FOUND", "User profile was not found", 404);
  }

  const authJson = await parseAuthJson<{ token?: string; user?: { id: string; email: string } }>(authResponse);
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
    200
  );

  copySetCookies(authResponse, response);
  return response;
}

