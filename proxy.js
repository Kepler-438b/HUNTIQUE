import { NextResponse } from "next/server";

export function proxy(request) {
  const host = request.headers.get("host") || "";
  const url = request.nextUrl.clone();

  // If accessing through analysis.localhost (or analysis.*)
  if (host.toLowerCase().startsWith("analysis.")) {
    if (url.pathname === "/") {
      url.pathname = "/analysis";
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
