import Link from "next/link";
import { cookies } from "next/headers";
import { bezpiecznaSciezka } from "../../../lib/db";
export const metadata = { title: "Sprawdź pocztę", robots: { index: false, follow: false } };

export default async function SprawdzPoczte() {
  const wroc = bezpiecznaSciezka((await cookies()).get("portal-powrot-logowania")?.value);
  return (
    <div className="wrap sekcja">
      <div className="waski" style={{ marginInline: "auto" }}>
        <div className="komunikat komunikat-sukces" style={{ marginBottom: "var(--o-5)" }}>
          <span aria-hidden="true">✓</span>
          <span><b>Link do logowania wysłany.</b> Sprawdź skrzynkę.</span>
        </div>

        <h1 style={{ fontSize: "var(--t-2xl)" }}>Otwórz wiadomość i kliknij link</h1>
        <p className="cichy" style={{ marginTop: "var(--o-3)" }}>
          Link zaloguje Cię lub utworzy Twoje konto i przeniesie z powrotem do portalu.
          Jest ważny 30 minut i działa tylko raz.
        </p>
        <p className="cichy">
          Aby zarezerwować list, po zalogowaniu otwórz go i kliknij „Potwierdź rezerwację”.
          Po zapisaniu rezerwacji otrzymasz osobny e-mail z numerem listu.
        </p>
        <p className="cichy">
          Jeśli wiadomość nie dotarła w ciągu kilku minut, zajrzyj do folderu
          ze spamem. Pierwsza wiadomość z nowej domeny czasem tam trafia.
        </p>

        <Link className="btn btn-cichy" href={"/zaloguj?wroc=" + encodeURIComponent(wroc)} style={{ marginTop: "var(--o-4)" }}>
          Popraw e-mail lub poproś o nowy link
        </Link>
      </div>
    </div>
  );
}
