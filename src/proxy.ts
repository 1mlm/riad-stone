import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, isAuthCookieValid } from "@/utils/auth";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url);
}

export default function proxy(request: NextRequest) {
  const isAuthenticated = isAuthCookieValid(
    request.cookies.get(AUTH_COOKIE_NAME)?.value,
  );
  const isGateRoute = request.nextUrl.pathname === "/gate";

  if (!isAuthenticated && !isGateRoute) return redirectTo(request, "/gate");
  if (isAuthenticated && isGateRoute) return redirectTo(request, "/");
  return NextResponse.next();
}
