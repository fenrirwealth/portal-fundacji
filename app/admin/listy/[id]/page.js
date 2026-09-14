import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "../../../../lib/db";
import { wymagajRedakcji } from "../../../../lib/admin";
import { WOJEWODZTWA, KATEGORIE } from "../../../../lib/slowniki";
import { aktualizujPrezent, zapiszList } from "../../actions";
import Status from "../../ui/Status";
import ListaKontrolna from "../../ui/ListaKontrolna";
import Podglad from "../../ui/Podglad";

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
  zapisany: "Zmiany zapisane jako szkic.",
  opublikowany: "List opublikowany — jest już widoczny dla darczyńców.",
  wycofany: "List wycofany. Zniknął ze strony publicznej.",
  prezent: "Stan prezentu zaktualizowany.",
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
        </section>
      )}

      <form action={zapiszList} className="formularz-admin">
        <input type="hidden" name="id" value={list.id} />
        <input type="hidden" name="wersja" value={list.zaktualizowany.toISOString()} />

        <fieldset disabled={zablokowany}>
          <legend>Dane publiczne</legend>
          <p className="drobny cichy" style={{ margin: 0 }}>
            Wszystko w tej sekcji zobaczy darczyńca. Nic poza nią nie opuszcza panelu.
          </p>
          <label>Imię dziecka<input name="imie" required maxLength={80} defaultValue={list.imie} /></label>
          <label>Wiek<input name="wiek" type="number" min="1" max="25" required defaultValue={list.wiek} /></label>
          <label>Województwo
            <select name="wojewodztwo" required defaultValue={list.wojewodztwo}>
              {WOJEWODZTWA.map((w) => <option key={w}>{w}</option>)}
            </select>
          </label>
          <label>Kategoria
            <select name="kategoria" required defaultValue={list.kategoria}>
              {KATEGORIE.map((k) => <option key={k}>{k}</option>)}
            </select>
          </label>
          <label>Marzenie<textarea name="marzenie" rows={3} required maxLength={300} defaultValue={list.marzenie} /></label>
          <label>Rozmiar<input name="rozmiar" maxLength={80} defaultValue={list.rozmiar || ""} /></label>
          <label>Opis publiczny<textarea name="opis" rows={5} maxLength={1200} defaultValue={list.opis || ""} /></label>
          <label>Adres przygotowanego zdjęcia listu (HTTPS)
            <input name="zdjecieUrl" type="url" pattern="https://.*" defaultValue={list.zdjecieUrl || ""} />
          </label>
        </fieldset>

        <ListaKontrolna
          pozycje={KONTROLA}
          wartosci={list.weryfikacja}
          zgodaPoczatkowa={Boolean(list.zgodaData && !list.zgodaCofnieta)}
          zablokowany={zablokowany}
        />

        {!zablokowany && (
          <div className="pasek-akcji-admin">
            <Podglad pola={{ numer: list.numer }} />
            <span style={{ flex: 1 }} />
            <button className="btn drugorzedny" name="operacja" value="zapisz">Zapisz jako szkic</button>
            <button className="btn" name="operacja" value="publikuj">Sprawdź i opublikuj</button>
            <button className="btn niebezpieczny" name="operacja" value="wycofaj">Wycofaj list</button>
          </div>
        )}
      </form>
    </div>
  );
}
