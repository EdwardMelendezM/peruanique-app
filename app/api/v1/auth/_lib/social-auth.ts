import { NextRequest } from "next/server";

import { auth } from "@/lib/auth";
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
  mobileSocialAuthBodySchema,
  parseAuthJson,
  sevenDaysFromNow,
  toCookieHeader,
} from "../../_lib/mobile-auth";

const getMobileUserSelect = {
  id: true,
  email: true,
  full_name: true,
  name: true,
  group: true,
  isDisabled: true,
} as const;

export async function handleMobileSocialAuth(
  request: NextRequest,
  provider: "google" | "apple"
) {
  const rawBody = await getRequestJson<unknown>(request);
  const socialPayload = rawBody && typeof rawBody === "object" ? rawBody : {};
  const parsed = mobileSocialAuthBodySchema.safeParse({
    ...socialPayload,
    provider,
    disableRedirect: true,
  });

  if (!parsed.success) {
    return jsonError("VALIDATION_ERROR", "Invalid social auth data", 422);
  }

  const authResponse = await forwardAuthRequest(request, "/api/auth/sign-in/social", parsed.data);

  if (!authResponse.ok) {
    const errorPayload = await parseAuthJson<{ message?: string }>(authResponse);
    return jsonError(
      mapStatusToErrorCode(authResponse.status),
      errorPayload?.message ?? `Unable to sign in with ${provider}`,
      authResponse.status
    );
  }

  const authJson = await parseAuthJson<{
    token?: string;
    user?: { email?: string };
  }>(authResponse);

  const cookieHeader = toCookieHeader(getSetCookies(authResponse));
  const sessionResult = cookieHeader
    ? await auth.api.getSession({ headers: new Headers({ cookie: cookieHeader }) })
    : null;

  const email =
    sessionResult?.user.email ?? authJson?.user?.email ?? parsed.data.idToken.user?.email ?? null;

  if (!email) {
    return jsonError("SERVER_ERROR", "Social auth did not return a user email", 500);
  }

  const mobileUser = await prisma.user.findUnique({
    where: { email },
    select: getMobileUserSelect,
  });

  if (!mobileUser) {
    return jsonError("NOT_FOUND", "User profile was not found", 404);
  }

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

