import Link from "next/link";
export const metadata = { title: "Nie udało się zalogować", robots: { index: false, follow: false } };

const OPISY = {
  Verification: "Ten link wygasł albo został już użyty. Linki działają 30 minut i tylko raz.",
  AccessDenied: "Nie możemy zalogować tego konta.",
  Configuration: "Po naszej stronie coś jest źle skonfigurowane. Prosimy o kontakt z Fundacją.",
};

export default async function BladLogowania({ searchParams }) {
  const p = (await searchParams) || {};
  const opis = OPISY[p.error] || "Logowanie się nie powiodło. Spróbuj jeszcze raz.";

  return (
    <div className="wrap sekcja">
      <div className="waski" style={{ marginInline: "auto" }}>
        <div className="komunikat komunikat-blad" style={{ marginBottom: "var(--o-5)" }}>
          <span aria-hidden="true">✕</span>
          <span>{opis}</span>
        </div>

        <h1 style={{ fontSize: "var(--t-2xl)" }}>Nie udało się zalogować</h1>
        <Link className="btn" href="/zaloguj" style={{ marginTop: "var(--o-5)" }}>
          Wróć do logowania
        </Link>
      </div>
    </div>
  );
}
