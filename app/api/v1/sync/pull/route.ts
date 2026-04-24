import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { getOfflineContent } from "@/features/sync/actions/pull-content"
import { jsonError } from "@/app/api/v1/_lib/mobile-auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers })

  if (!session) {
    return jsonError("UNAUTHORIZED", "Session not found", 401)
  }

  // Obtenemos el groupId del usuario (o del query param como fallback)
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      groupId: true,
    },
  })
  if (!user) {
    return jsonError("UNAUTHORIZED", "Session not found", 401)
  }
  if (!user.groupId) {
    return jsonError("UNAUTHORIZED", "User does not have group", 400)
  }

  const groupId = user.groupId

  try {
    const data = await getOfflineContent(groupId, user.id)
    return NextResponse.json({
      data: data,
      success: true,
    })
  } catch (error) {
    console.error("[SYNC_PULL_ERROR]", error)
    return jsonError("SERVER_ERROR", "Failed to pull", 500)
  }
}
