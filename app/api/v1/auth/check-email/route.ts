import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getRequestJson,
  jsonError,
  jsonSuccess
} from "../../_lib/mobile-auth";
import { z } from "zod";

// Esquema de validación simple
const checkEmailSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const rawBody = await getRequestJson<unknown>(request);
  const parsed = checkEmailSchema.safeParse(rawBody);

  if (!parsed.success) {
    return jsonError("VALIDATION_ERROR", "Email inválido", 422);
  }

  try {
    // Buscamos solo el ID para que la consulta sea lo más ligera posible
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true },
    });

    return jsonSuccess({
      exists: !!user,
      email: parsed.data.email
    }, 200);

  } catch (error) {
    console.error("[ERROR_CHECK_EMAIL]", error);
    return jsonError("SERVER_ERROR", "Error al verificar el correo", 500);
  }
}