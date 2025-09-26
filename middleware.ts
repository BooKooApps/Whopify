import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function extractExperienceIdFromReferer(referer: string | null | undefined): string | null {
  if (!referer) return null;
  try {
    const url = new URL(referer);
    const m = url.pathname.match(/\/experiences\/(exp_[A-Za-z0-9]+)/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  if (pathname === "/") {
    const qpExp = searchParams.get("experienceId") || searchParams.get("exp") || searchParams.get("experience");
    const headerExp = req.headers.get("x-whop-experience-id");
    const refExp = extractExperienceIdFromReferer(req.headers.get("referer"));
    const exp = qpExp || headerExp || refExp;
    if (exp && /^exp_[A-Za-z0-9]+$/.test(exp)) {
      const url = req.nextUrl.clone();
      url.pathname = `/ssr/${exp}`;
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};


