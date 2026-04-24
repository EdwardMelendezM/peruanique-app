import { auth } from "@/lib/auth"
import { SyncPushSchema } from "@/features/sync/schemas/sync-schemas"
import { syncUserAttempts } from "@/features/sync/actions/push-attempts"
import { NextRequest, NextResponse } from "next/server"
import { jsonError } from "@/app/api/v1/_lib/mobile-auth"

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })

  if (!session) {
    return jsonError("UNAUTHORIZED", "Session not found", 401)
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
      },
    })

    if (!user) {
      return jsonError("UNAUTHORIZED", "User not found", 401)
    }
    const body = await request.json()
    const { attempts } = SyncPushSchema.parse(body)

    const attemptsFormatted = attempts.map((a) => ({
      ...a,
      answeredAt: new Date(a.answeredAt), // Convertir timestamp a Date
    }))

    const result = await syncUserAttempts(session.user.id, attemptsFormatted)
    return NextResponse.json(result)
  } catch (error) {
    console.error("[SYNC_PUSH_ATTEMPTS_ERROR]:", error)
    return jsonError("SERVER_ERROR", "Failed to push", 500)
  }
}
