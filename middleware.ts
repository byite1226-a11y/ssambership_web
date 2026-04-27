import { type NextRequest, NextResponse } from "next/server";

/**
 * RSC `requireRole`이 로그인으로 보낼 때 `next`에 붙일 복귀 URL.
 * (상대 path + query, open redirect는 `safeInternalNextPath`에서 제거)
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const returnPath = `${pathname}${search}`;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set("x-return-to", returnPath);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf)).*)"],
};
