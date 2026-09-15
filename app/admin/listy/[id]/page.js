import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "../../../../lib/db";
import { wymagajRedakcji } from "../../../../lib/admin";
import { WOJEWODZTWA, KATEGORIE } from "../../../../lib/slowniki";
import { aktualizujPrezent, zapiszList, zwolnijRezerwacjeListu } from "../../actions";
import Status from "../../ui/Status";
import FormularzListu from "../../ui/FormularzListu";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edycja listu", robots: { index: false, follow: false } };

const KONTROLA = [
  ["zgodaDolaczona", "Zgoda dyrektora jest w dokumentacji Fundacji"],
  ["brakNazwiska", "Brak nazwiska dziecka"],
  ["brakPlacowki", "Brak nazwy i adresu placówki"],
  ["brakMiejscowosci", "Brak miejscowości pozwalającej zidentyfikować dziecko"],
  ["brakInnychOsob", "Brak danych innych osób"],
  ["brakDanychWrazliwych", "Brak danych o zdrowiu i innych danych wrażliwych"],
  ["brakWizerunku", "Brak wizerunku dziecka"],
  ["metadaneUsuniete", "Usunięto metadane pliku"],
  ["nazwaPlikuPoprawna", "Nazwa pliku nie zawiera danych osobowych"],
  ["opisPoprawny", "Opis publiczny został sprawdzony"],
];

const KOMUNIKATY = {
  utworzony: "Szkic listu został utworzony.",
  przywrocony: "List przywrócony do szkiców. Nie jest opublikowany — wymaga ponownego sprawdzenia.",
  zapisany: "Zmiany zapisane jako szkic.",
  opublikowany: "List opublikowany — jest już widoczny dla darczyńców.",
  wycofany: "List wycofany. Zniknął ze strony publicznej.",
  prezent: "Stan prezentu zaktualizowany.",
  zwolniony: "Rezerwacja została ręcznie zwolniona, a list wrócił do puli.",
};

export default async function EdycjaListu({ params, searchParams }) {
  const { id } = await params;
  await wymagajRedakcji("/admin/listy/" + id);
  const p = (await searchParams) || {};

  const list = await db.list.findUnique({
    where: { id },
    include: {
      placowka: { select: { nazwa: true } },
      edycja: { select: { nazwa: true } },
      weryfikacja: true,
      skan: { select: { id: true, status: true, utworzony: true } },
      rezerwacje: {
        where: { status: { in: ["OCZEKUJE", "POTWIERDZONA", "DOSTARCZONA"] } },
        orderBy: { utworzona: "desc" },
        take: 1,
        select: {
          id: true, status: true, wygasa: true,
          user: { select: { email: true } },
          prezent: { select: { stan: true, dataPrzyjecia: true } },
        },
      },
    },
  });
  if (!list) notFound();

  const zablokowany = ["ZAREZERWOWANY", "OPLACONY", "PRZEKAZANY"].includes(list.status);
  const rezerwacja = list.rezerwacje[0];

  return (
    <div className="wrap sekcja">
      <Link className="btn btn-tekstowy" href="/admin" style={{ marginLeft: "calc(var(--o-2) * -1)" }}>
        ← Panel redakcji
      </Link>

      <div className="naglowek-rzad" style={{ marginTop: "var(--o-4)" }}>
        <div>
          <h1 className="tytul">List nr {list.numer}: {list.imie}</h1>
          <p className="wstep" style={{ marginTop: "var(--o-2)" }}>
            {list.placowka.nazwa} · {list.edycja.nazwa}
          </p>
        </div>
        <Status status={list.status} />
      </div>

      {p.blad && <p className="blad" role="alert">{p.blad}</p>}
      {p.sukces && <p className="info" role="status">{KOMUNIKATY[p.sukces] || "Zmiany zapisano poprawnie."}</p>}
      {zablokowany && (
        <p className="blad">
          List jest w realizacji. Dane są zablokowane przed przypadkową zmianą —
          darczyńca podjął już zobowiązanie na podstawie tej treści.
        </p>
      )}

      {rezerwacja && (
        <section className="realizacja">
          <h2>Realizacja prezentu</h2>
          <p className="maly">
            Darczyńca: <b>{rezerwacja.user.email}</b> · rezerwacja: {rezerwacja.status}
            {rezerwacja.prezent ? ` · prezent: ${rezerwacja.prezent.stan}` : ""}
          </p>
          <form action={aktualizujPrezent} className="naglowek-rzad" style={{ marginTop: "var(--o-4)" }}>
            <input type="hidden" name="id" value={list.id} />
            {rezerwacja.status === "POTWIERDZONA" && list.status === "ZAREZERWOWANY" && (
              <button className="btn" name="operacja" value="przyjmij">Oznacz prezent jako przyjęty</button>
            )}
            {rezerwacja.prezent?.stan === "PRZYJETY" && (
              <button className="btn" name="operacja" value="sprawdz">Oznacz jako sprawdzony</button>
            )}
            {rezerwacja.prezent?.stan === "SPRAWDZONY" && (
              <button className="btn" name="operacja" value="zapakuj">Oznacz jako zapakowany</button>
            )}
            {rezerwacja.prezent?.stan === "ZAPAKOWANY" && (
              <button className="btn" name="operacja" value="wydaj">Oznacz jako przekazany placówce</button>
            )}
          </form>
          {list.status === "ZAREZERWOWANY" && (
            <details style={{ marginTop: "var(--o-4)" }}>
              <summary className="btn drugorzedny">Opcje awaryjne</summary>
              <form action={zwolnijRezerwacjeListu} style={{ marginTop: "var(--o-3)" }}>
                <input type="hidden" name="id" value={list.id} />
                <p className="drobny cichy">Użyj tylko po kontakcie z darczyńcą. List natychmiast wróci do publicznej puli.</p>
                <button className="btn niebezpieczny" type="submit" style={{ marginTop: "var(--o-2)" }}>Potwierdzam — zwolnij rezerwację</button>
              </form>
            </details>
          )}
        </section>
      )}

      {list.skan && (
        <section className="realizacja">
          <div className="naglowek-rzad">
            <div><h2>Prywatny skan źródłowy</h2><p className="drobny cichy">Status: {list.skan.status} · dostęp tylko dla redakcji</p></div>
            <a className="btn drugorzedny" href={`/api/admin/skany/${list.skan.id}`} target="_blank" rel="noreferrer">Otwórz w pełnym rozmiarze</a>
          </div>
          <Image className="podglad-skanu" src={`/api/admin/skany/${list.skan.id}`} alt="Prywatny skan listu do weryfikacji" width={1200} height={1600} unoptimized />
        </section>
      )}

      <FormularzListu
        akcja={zapiszList}
        list={{
          id: list.id,
          numer: list.numer,
          wersja: list.zaktualizowany.toISOString(),
          imie: list.imie,
          wiek: list.wiek,
          wojewodztwo: list.wojewodztwo,
          kategoria: list.kategoria,
          marzenie: list.marzenie,
          rozmiar: list.rozmiar,
          opis: list.opis,
          zdjecieUrl: list.zdjecieUrl,
          zgodaPrzyjeta: Boolean(list.zgodaData && !list.zgodaCofnieta),
        }}
        weryfikacja={list.weryfikacja}
        kontrola={KONTROLA}
        wojewodztwa={WOJEWODZTWA}
        kategorie={KATEGORIE}
        zablokowany={zablokowany}
        wycofany={list.status === "WYCOFANY"}
      />

    </div>
  );
}
