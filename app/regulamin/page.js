import { redirect } from "next/navigation";
import { auth } from "../../auth";
import { db, WERSJA_REGULAMINU, bezpiecznaSciezka } from "../../lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Regulamin akcji",
  description: "Zasady bezpiecznego udziału w akcji Listy do Świętego Mikołaja.",
  alternates: { canonical: "/regulamin" },
};

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
        <p><b>2.</b> Darczyńca rezerwuje jeden list naraz. Rezerwację należy
        potwierdzić w ciągu 3 dni, w przeciwnym razie list wraca do puli
        i może go wybrać ktoś inny.</p>
        <p><b>3.</b> Prezent należy dostarczyć do siedziby Fundacji w terminie
        podanym przy liście. Paczki nie należy owijać — Fundacja sprawdza
        zawartość przed przekazaniem i pakuje ją samodzielnie.</p>
        <p><b>4.</b> Fundacja może odmówić przekazania przedmiotu niezgodnego
        z regulaminem placówki lub nieodpowiedniego dla wieku dziecka.</p>
        <p><b>5.</b> Darczyńca nie kontaktuje się z dzieckiem bezpośrednio.
        Nie otrzymuje danych kontaktowych ani identyfikujących: nazwiska
        dziecka, jego adresu, nazwy i adresu placówki, numeru telefonu
        ani adresu e-mail.</p>
        <p><b>6.</b> Przy każdym liście publikujemy imię, wiek, województwo,
        opis marzenia i kategorię prezentu, w razie potrzeby rozmiar ubrania
        lub buta, oraz zdjęcie listu przygotowane przez Fundację. Nie publikujemy
        nazwisk, nazwy placówki, miejscowości, adresu ani wizerunku dziecka.</p>
        <p><b>7.</b> Administratorem danych darczyńcy jest Fundacja. Dane służą
        wyłącznie obsłudze akcji. Przysługuje prawo dostępu, sprostowania,
        usunięcia oraz wniesienia skargi do Prezesa UODO.</p>
        <p><b>8.</b> Udział w akcji jest nieodpłatny i dobrowolny. Rezerwację
        można anulować w każdej chwili w panelu &bdquo;Moje listy&rdquo;.</p>
      </div>

      {!sesja?.user?.id && (
        <p style={{ marginTop: "var(--o-6)" }}>
          <Link className="btn" href={"/zaloguj?wroc=" + encodeURIComponent("/regulamin?wroc=" + wroc)}>
            Zaloguj się, żeby zaakceptować
          </Link>
        </p>
      )}

      {sesja?.user?.id && zaakceptowany && (
        <p className="komunikat komunikat-sukces" style={{ marginTop: "var(--o-6)" }}>
          Regulamin w wersji {WERSJA_REGULAMINU} został już przez Ciebie
          zaakceptowany. <Link href={wroc}>Wróć do listów</Link>.
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
            Akceptuję regulamin
          </button>
        </form>
      )}
    </div></div>
  );
}
