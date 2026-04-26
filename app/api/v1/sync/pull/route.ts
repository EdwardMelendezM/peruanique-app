import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { getOfflineContent } from "@/features/sync/actions/pull-content"
import { jsonError } from "@/app/api/v1/_lib/mobile-auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return jsonError("UNAUTHORIZED", "Session not found", 401);

  // Recibimos los dominios del body (POST es mejor para enviar arrays largos)
  const { domains = [] } = await req.json();

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, groupId: true }
  });

  if (!user?.groupId) return jsonError("FORBIDDEN", "User group missing", 400);

  try {
    const data = await getOfflineContent({
      domains,
      groupId: user.groupId,
      userId: user.id
    });

    return NextResponse.json({
      data,
      serverTime: new Date().toISOString(),
      success: true,
    });
  } catch (error) {
    console.error("[ERROR_PULL_REQUEST]", error);
    return jsonError("SERVER_ERROR", "Sync failed", 500);
  }
}