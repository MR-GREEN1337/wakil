import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token");
  const userPaid = request.cookies.get("userPaid"); //Flag if user has paid
  const planId = request.cookies.get("planId"); //Flag if user has paid

  if (request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname.startsWith("/sidebar")) {
    if (!token) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
    else if (!userPaid && !planId) {
      return NextResponse.redirect(new URL("/checkout", request.url));
    }
  } else if (request.nextUrl.pathname === "/sign-in") {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/sign-in"],
};