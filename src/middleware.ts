import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const access = request.cookies.get("polyraaga_access_mw")?.value;

  if (!access && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};