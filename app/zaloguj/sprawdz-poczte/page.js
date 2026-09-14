import Link from "next/link";
export const metadata = { title: "Sprawdź pocztę", robots: { index: false, follow: false } };

export default function SprawdzPoczte() {
  return (
    <div className="wrap sekcja">
      <div className="waski" style={{ marginInline: "auto" }}>
        <div className="komunikat komunikat-sukces" style={{ marginBottom: "var(--o-5)" }}>
          <span aria-hidden="true">✓</span>
          <span><b>Link wysłany.</b> Sprawdź skrzynkę.</span>
        </div>

        <h1 style={{ fontSize: "var(--t-2xl)" }}>Sprawdź pocztę</h1>
        <p className="cichy" style={{ marginTop: "var(--o-3)" }}>
          Kliknij link w ciągu 30 minut — po tym czasie przestanie działać
          i trzeba będzie poprosić o nowy.
        </p>
        <p className="cichy">
          Jeśli wiadomość nie dotarła w ciągu kilku minut, zajrzyj do folderu
          ze spamem. Pierwsza wiadomość z nowej domeny czasem tam trafia.
        </p>

        <Link className="btn btn-cichy" href="/zaloguj" style={{ marginTop: "var(--o-4)" }}>
          Wyślij link jeszcze raz
        </Link>
      </div>
    </div>
  );
}
