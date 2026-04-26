import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { jsonError } from "@/app/api/v1/_lib/mobile-auth";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return jsonError("UNAUTHORIZED", "No session", 401);

    const { searchParams } = new URL(req.url);
    const lastSync = searchParams.get("lastSync");
    const groupId = searchParams.get("groupId");

    if (!groupId) return jsonError("FORBIDDEN", "Missing groupId", 400);

    // 1. DESCUBRIMIENTO DINÁMICO DE DOMINIOS
    // Buscamos qué cursos están realmente en el roadmap de este grupo
    const relevantCourses = await prisma.course.findMany({
      where: {
        questions: {
          some: {
            lessons: {
              some: {
                lesson: {
                  roadmapNodes: { some: { groupId } }
                }
              }
            }
          }
        }
      },
      select: { id: true }
    });

    // 2. CONSTRUCCIÓN DE LA LISTA DE DOMINIOS A MONITOREAR
    const domainsToWatch = [
      `ROADMAP:${groupId}`,
      "COURSES_CONTENT",
      "GLOBAL_CONFIG",
      ...relevantCourses.map(c => `QUESTIONS:${c.id}`)
    ];

    if (lastSync === "0") {
      // First try of new user
      return NextResponse.json({
        success: true,
        needsUpdate: true,
        // Solo enviamos los nombres de los dominios que realmente cambiaron
        changes: [],
        // El móvil guardará este serverTime para su próxima consulta
        serverTime: new Date().toISOString()
      });
    }

    // 3. CONSULTA OPTIMIZADA AL REGISTRY
    // Convertimos lastSync a Date. Si es null o inválido, usamos una fecha antigua (1970)
    const lastSyncDate = lastSync ? new Date(lastSync) : new Date(0);

    const changes = await prisma.syncRegistry.findMany({
      where: {
        domain: { in: domainsToWatch },
        lastUpdated: { gt: lastSyncDate }
      },
      select: {
        domain: true,
        version: true,
        lastUpdated: true
      }
    });

    // 4. RESPUESTA ESTRUCTURADA
    return NextResponse.json({
      success: true,
      needsUpdate: changes.length > 0,
      // Solo enviamos los nombres de los dominios que realmente cambiaron
      changes: changes.map(c => c.domain),
      // El móvil guardará este serverTime para su próxima consulta
      serverTime: new Date().toISOString()
    });

  } catch (error) {
    console.error("[ERROR_CHECK_SYNC]", error);
    return jsonError("SERVER_ERROR", "Internal Sync Error", 500);
  }
}