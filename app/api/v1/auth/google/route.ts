import { NextRequest } from "next/server";

import { handleMobileSocialAuth } from "../_lib/social-auth";

export async function POST(request: NextRequest) {
  return handleMobileSocialAuth(request, "google");
}

