import { NextResponse } from "next/server";

// To nie jest autoryzacja. Proxy jedynie odsiewa ruch bez ciasteczka,
// zanim dotknie bazy. Właściwa kontrola roli pozostaje w
// wymagajRedakcji() i jest wykonywana na serwerze przy każdym wejściu.
const CIASTECZKA_SESJI = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
];

export function proxy(request) {
  const maSesje = CIASTECZKA_SESJI.some(
    (nazwa) => request.cookies.get(nazwa)?.value
  );

  if (maSesje) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const cel = new URL("/zaloguj", request.url);
  cel.searchParams.set("wroc", pathname + search);
  return NextResponse.redirect(cel);
}

export const config = {
  matcher: ["/admin/:path*"],
};
