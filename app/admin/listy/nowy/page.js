import Link from "next/link";
import { db } from "../../../../lib/db";
import { wymagajRedakcji } from "../../../../lib/admin";
import { WOJEWODZTWA, KATEGORIE } from "../../../../lib/slowniki";
import { utworzList } from "../../actions";
import FormularzNowy from "../../ui/FormularzNowy";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nowy list", robots: { index: false, follow: false } };

export default async function NowyList({ searchParams }) {
  await wymagajRedakcji("/admin/listy/nowy");
  const p = (await searchParams) || {};

  const [udzialy, skany] = await Promise.all([
    db.udzialPlacowki.findMany({
      where: { status: "POTWIERDZILA", edycja: { aktywna: true } },
      include: { placowka: { select: { nazwa: true, wojewodztwo: true } } },
      orderBy: { placowka: { nazwa: "asc" } },
    }),
    db.skanListu.findMany({
      where: { status: { in: ["NOWY", "W_MODERACJI"] }, list: null, udzial: { edycja: { aktywna: true } } },
      include: { udzial: { include: { placowka: { select: { nazwa: true } } } } },
      orderBy: { utworzony: "asc" },
    }),
  ]);
  const wybranySkan = skany.find((s) => s.id === p.skan);

  return (
    <div className="wrap sekcja">
      <Link className="btn btn-tekstowy" href="/admin" style={{ marginLeft: "calc(var(--o-2) * -1)" }}>
        ← Panel redakcji
      </Link>

      <h1 className="tytul" style={{ marginTop: "var(--o-4)" }}>Nowy list</h1>
      <p className="wstep" style={{ marginTop: "var(--o-2)" }}>
        List powstaje jako szkic. Publikacja będzie możliwa dopiero po przyjęciu
        zgody dyrektora i zaznaczeniu całej listy kontrolnej.
      </p>

      {p.blad && <p className="blad" role="alert">{p.blad}</p>}

      {udzialy.length === 0 ? (
        <div className="pusto" style={{ marginTop: "var(--o-6)" }}>
          <h3>Brak zatwierdzonych placówek</h3>
          <p>
            Listy można dodawać tylko dla placówek, których zgłoszenie zostało
            zatwierdzone w aktywnej edycji.
          </p>
          <Link className="btn" href="/admin" style={{ marginTop: "var(--o-4)" }}>
            Przejdź do zgłoszeń
          </Link>
        </div>
      ) : (
        <FormularzNowy
          akcja={utworzList}
          udzialy={udzialy.map((u) => ({ id: u.id, nazwa: u.placowka.nazwa, wojewodztwo: u.placowka.wojewodztwo }))}
          skany={skany.map((s) => ({ id: s.id, udzialId: s.udzialId, nazwa: s.udzial.placowka.nazwa, data: s.utworzony.toLocaleDateString("pl-PL") }))}
          domyslnySkanId={wybranySkan?.id || ""}
          domyslnyUdzialId={wybranySkan?.udzialId || ""}
          wojewodztwa={WOJEWODZTWA}
          kategorie={KATEGORIE}
        />
      )}
    </div>
  );
}
