import { NextRequest } from "next/server";

import {
  copySetCookies,
  forwardAuthRequest,
  jsonError,
  jsonSuccess,
  mapStatusToErrorCode,
  parseAuthJson,
} from "../../_lib/mobile-auth";

export async function POST(request: NextRequest) {
  const authResponse = await forwardAuthRequest(request, "/api/auth/sign-out");

  if (!authResponse.ok) {
    const errorPayload = await parseAuthJson<{ message?: string }>(authResponse);
    return jsonError(
      mapStatusToErrorCode(authResponse.status),
      errorPayload?.message ?? "Unable to sign out",
      authResponse.status
    );
  }

  const response = jsonSuccess({ loggedOut: true }, 200);
  copySetCookies(authResponse, response);
  return response;
}

