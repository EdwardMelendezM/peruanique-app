import {NextRequest, NextResponse} from "next/server";
import {getSessionCookie} from "better-auth/cookies";

// Routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/register", "/auth/login", "/auth/register"];
const PUBLIC_PREFIXES = ["/_next"];

/**
 * Determines if a route should be accessible without authentication.
 */
function isPublicRoute(pathname: string): boolean {
  return (
    PUBLIC_ROUTES.some(route => pathname.includes(route)) ||
    PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))
  );
}

/**
 * Authentication middleware for protecting routes.
 * - Public routes bypass authentication checks
 * - API requests without auth return 401 (mobile app UX)
 * - Web requests without auth redirect to login page
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    // Return 401 for API requests (mobile app compatibility)
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Redirect to login for web requests
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
  ],
};
