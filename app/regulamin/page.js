import { redirect } from "next/navigation";
import { auth } from "../../auth";
import { db, WERSJA_REGULAMINU, bezpiecznaSciezka } from "../../lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = { title: "Regulamin akcji" };

export default async function Regulamin({ searchParams }) {
  const sesja = await auth();
  const p = (await searchParams) || {};
  const wroc = bezpiecznaSciezka(p.wroc);

  const konto = sesja?.user?.id
    ? await db.user.findUnique({
        where: { id: sesja.user.id },
        select: { zgodaRegulamin: true, wersjaRegulaminu: true },
      })
    : null;

  const zaakceptowany =
    konto?.zgodaRegulamin && konto.wersjaRegulaminu === WERSJA_REGULAMINU;

  return (
    <div className="wrap sekcja"><div className="waski" style={{ marginInline: "auto" }}>
      <h1 style={{ fontSize: "var(--t-2xl)" }}>Regulamin akcji &bdquo;Listy do Świętego Mikołaja&rdquo;</h1>
      <p className="drobny cichy" style={{ marginTop: "var(--o-2)" }}>Wersja {WERSJA_REGULAMINU}</p>

      <div className="czytanie" style={{ marginTop: "var(--o-6)" }}>
        <p><b>1.</b> Organizatorem akcji jest Fundacja Lepszy Dom Lepsze Jutro,
        KRS 0000971976.</p>
        <p><b>2.</b> Darczynca rezerwuje jeden list naraz. Rezerwacje nalezy
        potwierdzic w ciagu 3 dni, w przeciwnym razie list wraca do puli
        i moze go wybrac ktos inny.</p>
        <p><b>3.</b> Prezent nalezy dostarczyc do siedziby Fundacji w terminie
        podanym przy liscie. Paczki nie nalezy owijac — Fundacja sprawdza
        zawartosc przed przekazaniem i pakuje ja samodzielnie.</p>
        <p><b>4.</b> Fundacja moze odmowic przekazania przedmiotu niezgodnego
        z regulaminem placowki lub nieodpowiedniego dla wieku dziecka.</p>
        <p><b>5.</b> Darczynca nie kontaktuje sie z dzieckiem bezposrednio.
        Nie otrzymuje danych kontaktowych ani identyfikujacych: nazwiska
        dziecka, jego adresu, nazwy i adresu placowki, numeru telefonu
        ani adresu e-mail.</p>
        <p><b>6.</b> Przy kazdym liscie publikujemy imie, wiek, wojewodztwo, opis marzenia i kategorie prezentu, w razie potrzeby rozmiar ubrania lub buta, oraz zdjecie listu przygotowane przez Fundacje.
        Nie publikujemy nazwisk, nazwy placowki, miejscowosci, adresu ani wizerunku dziecka.</p>
        <p><b>7.</b> Administratorem danych darczyncy jest Fundacja. Dane sluza
        wylacznie obsludze akcji. Przysluguje prawo dostepu, sprostowania,
        usuniecia oraz wniesienia skargi do Prezesa UODO.</p>
        <p><b>8.</b> Udzial w akcji jest nieodplatny i dobrowolny. Rezerwacje
        mozna anulowac w kazdej chwili w panelu &bdquo;Moje rezerwacje&rdquo;.</p>
      </div>

      {!sesja?.user?.id && (
        <p style={{ marginTop: "var(--o-6)" }}>
          <Link className="btn" href={"/zaloguj?wroc=" + encodeURIComponent("/regulamin?wroc=" + wroc)}>
            Zaloguj sie, zeby zaakceptowac
          </Link>
        </p>
      )}

      {sesja?.user?.id && zaakceptowany && (
        <p className="komunikat komunikat-sukces" style={{ marginTop: "var(--o-6)" }}>
          Regulamin w wersji {WERSJA_REGULAMINU} zostal juz przez Ciebie
          zaakceptowany. <Link href={wroc}>Wroc do listow</Link>.
        </p>
      )}

      {sesja?.user?.id && !zaakceptowany && (
        <form
          action={async (formData) => {
            "use server";
            const s = await auth();
            if (!s?.user?.id) redirect("/zaloguj");
            // Zapisujemy date ORAZ wersje tresci. Bez wersji nie da sie
            // wykazac, na co dokladnie uzytkownik sie zgodzil.
            await db.user.update({
              where: { id: s.user.id },
              data: {
                zgodaRegulamin: new Date(),
                wersjaRegulaminu: WERSJA_REGULAMINU,
              },
            });
            // Sciezke filtrujemy ponownie przy zapisie: pole formularza
            // takze pochodzi od uzytkownika i moglo zostac podmienione.
            redirect(bezpiecznaSciezka(formData.get("wroc")));
          }}
          style={{ marginTop: "var(--o-6)" }}
        >
          <input type="hidden" name="wroc" value={wroc} />
          <button className="btn btn-duzy" type="submit">
            Akceptuje regulamin
          </button>
        </form>
      )}
    </div></div>
  );
}
