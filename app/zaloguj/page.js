import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Mail, Heart } from "lucide-react";
import { auth } from "../../auth";
import { zalogujHaslem } from "./haslo-actions";
import { bezpiecznaSciezka } from "../../lib/db";
import Pole from "../ui/Pole";
import FormularzEmail from "./FormularzEmail";

export const metadata = { title: "Dołącz lub zaloguj się", robots: { index: false, follow: false } };

export default async function Zaloguj({ searchParams }) {
  const p = (await searchParams) || {};
  const cel = bezpiecznaSciezka(p.wroc ?? (await cookies()).get("portal-powrot-logowania")?.value);
  const wroc = cel.startsWith("/zaloguj") ? "/listy" : cel;
  const sesja = await auth();
  if (sesja?.user?.id) redirect(wroc);
  const wybranyList = /^\/listy\/[^/?#]+$/.test(wroc);

  return (
    <div className="wrap sekcja logowanie">
      <div className="logowanie-karta">
        <div className="logowanie-ikona" aria-hidden="true"><Heart /></div>
        <p className="logowanie-nadtytul">Twoja pomoc zaczyna się tutaj</p>
        <h1>{wybranyList ? "Jeszcze krok do spełnienia marzenia" : "Dołącz lub zaloguj się"}</h1>
        <p className="cichy logowanie-wstep">Wystarczy Twój e-mail. Wyślemy link, który otworzy Twoje konto — bez hasła i długiej rejestracji.</p>
        {wybranyList && <p className="logowanie-kontekst"><Mail aria-hidden="true" /> Po zalogowaniu wrócisz do wybranego listu. Rezerwację potwierdzisz na jego stronie.</p>}
        <FormularzEmail wroc={wroc} />
        <p className="drobny cichy logowanie-wyjasnienie">Jesteś tu pierwszy raz? Konto utworzymy po kliknięciu linku. Masz już konto? Ten sam formularz Cię zaloguje.</p>
        <p className="drobny cichy">Adres e-mail służy do logowania i kontaktu w sprawie Twoich listów. <Link href="/regulamin">Zasady udziału i prywatności</Link>.</p>
        <Link className="btn btn-tekstowy logowanie-powrot" href={wybranyList ? wroc : "/listy"}>← {wybranyList ? "Wróć do wybranego listu" : "Najpierw obejrzyj listy dzieci"}</Link>
        <details className="logowanie-admin" open={Boolean(p.blad || p.ustawione || wroc.startsWith("/admin"))}>
          <summary>Panel Fundacji — logowanie administratora</summary>
          {p.ustawione && <p role="status">Hasło zapisane. Zaloguj się nowym hasłem.</p>}
          {p.blad && <p role="alert" className="blad">{p.blad}</p>}
          <form action={zalogujHaslem}>
            <Pole id="admin-email" name="email" typ="email" etykieta="E-mail administratora" wymagane autoComplete="username" />
            <Pole id="admin-haslo" name="haslo" typ="password" etykieta="Hasło" wymagane autoComplete="current-password" maxLength={128} />
            <button className="btn btn-pelny" type="submit">Zaloguj do panelu</button>
          </form>
          <p className="drobny cichy">Pierwsze logowanie lub odzyskanie dostępu: użyj formularza e-mail powyżej. Po wejściu do panelu wybierz „Ustaw hasło”.</p>
        </details>
      </div>
    </div>
  );
}
