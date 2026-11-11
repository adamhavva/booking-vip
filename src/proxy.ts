import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic auth check for the admin area.
 *
 * This only looks at the *presence* of the session cookie — cheap and safe to
 * run before rendering. The cryptographic verification (and the email
 * allowlist check) happens on the server inside `getAdminSession()`, which is
 * what actually protects the data.
 *
 * The proxy deliberately never sends `/admin/login` back to `/admin`: it
 * cannot tell a valid cookie from a stale one, so that decision belongs to
 * the login page, which verifies the session properly. Doing it here would
 * create a redirect loop for operators whose cookie has expired.
 */

const ADMIN_SESSION_COOKIE = "admin_session";
const LOGIN_PATH = "/admin/login";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Deployment kill-switch — the whole admin surface is switched off.
  if (process.env.ADMIN_ENABLED !== "1") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const hasSession = Boolean(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);

  // The login page is always reachable; it decides what to do with a cookie.
  if (pathname === LOGIN_PATH) {
    return NextResponse.next();
  }

  // No cookie at all → send the operator to the login page.
  if (!hasSession) {
    const url = new URL(LOGIN_PATH, request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
