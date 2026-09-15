import { NextResponse } from "next/server";

// ------------------------------------------------------------
//  To NIE jest autoryzacja.
//
//  Sesje trzymamy w bazie (strategy: "database" + adapter Prisma),
//  a middleware dziala w runtime Edge, gdzie Prisma jest niedostepna.
//  Nie odczytamy tu wiec roli uzytkownika ani nie zweryfikujemy
//  waznosci sesji — sprawdzamy wylacznie, czy ciasteczko sesji w ogole
//  istnieje. To odcina ruch anonimowy, zanim dotknie bazy.
//
//  Wlasciwa kontrola dostepu pozostaje w wymagajRedakcji() z lib/admin.js,
//  ktore przy kazdym wejsciu odczytuje role z bazy. Kazda nowa strona pod
//  /admin MUSI ja wywolywac — samo to middleware jej nie ochroni.
// ------------------------------------------------------------

const CIASTECZKA_SESJI = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
];

export function middleware(request) {
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
