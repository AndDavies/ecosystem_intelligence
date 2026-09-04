import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";
import { indexNowInternalKeyHeader, isValidIndexNowKey } from "@/lib/seo/indexnow";

const protectedRoutes = ["/account", "/admin", "/collections", "/connect", "/submit"];
const legacyAtlasParameters = new Set([
  "q", "bounds", "region", "metro", "type", "capability", "domain", "mission", "demand", "stage", "program", "page", "pageSize"
]);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const indexNowKey = process.env.INDEXNOW_KEY?.trim();
  if (isValidIndexNowKey(indexNowKey) && pathname === `/${indexNowKey}.txt`) {
    const destination = request.nextUrl.clone();
    const requestHeaders = new Headers(request.headers);
    destination.pathname = "/api/indexnow-key";
    requestHeaders.set(indexNowInternalKeyHeader, indexNowKey);
    return NextResponse.rewrite(destination, { request: { headers: requestHeaders } });
  }

  // The root route is now the cacheable service entrance. Preserve legacy
  // atlas links by moving only discovery-bearing URLs into the atlas workspace;
  // campaign-only landing URLs remain on `/`.
  if (pathname === "/" && Array.from(request.nextUrl.searchParams.keys()).some((key) => legacyAtlasParameters.has(key))) {
    const destination = request.nextUrl.clone();
    destination.pathname = "/map";
    return NextResponse.redirect(destination, 308);
  }

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  if (!hasSupabasePublicEnv()) {
    return NextResponse.next();
  }

  return await updateSession(request);
}

export const config = {
  // Middleware executes before cache. Keep the compatibility redirect at the
  // service entrance and session refresh only on private workflows so public
  // catalogue and record requests can be served directly from the CDN.
  matcher: ["/", "/:indexnowKey.txt", "/account/:path*", "/admin/:path*", "/collections/:path*", "/connect/:path*", "/submit/:path*"]
};
