import {NextRequest, NextResponse} from "next/server";
import {getSessionCookie} from "better-auth/cookies";
import {auth} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

export async function proxy(request: NextRequest) {
  const {pathname} = request.nextUrl;

  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/_next")
  ) {
    return NextResponse.next();
  }

  // 1. Si NO hay sesión y el usuario intenta entrar a una ruta protegida
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    // Redirigir al login en lugar de 404 para mejorar la UX
    const loginUrl = new URL("/login", request.url);
    // Opcional: guardar la URL de origen para volver después del login
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
  ],
};
