import {NextRequest, NextResponse} from "next/server";
import {getSessionCookie} from "better-auth/cookies";

// proxy.ts (Middleware)
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir siempre estas rutas sin chequear sesión
  const isPublicRoute =
    pathname.includes("/auth/login") ||
    pathname.includes("/auth/register") ||
    pathname.startsWith("/_next");

  if (isPublicRoute) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);

  // Si es una petición de API y no hay sesión, devuelve 401, no redirección (UX de App Móvil)
  if (!sessionCookie && pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}