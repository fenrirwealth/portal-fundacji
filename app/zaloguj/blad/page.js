export const metadata = {
  title: "Nie udalo sie zalogowac",
  robots: { index: false, follow: false },
};

const OPISY = {
  Verification: "Ten link wygasl albo zostal juz uzyty. Linki dzialaja 30 minut i tylko raz.",
  AccessDenied: "Nie mozemy zalogowac tego konta.",
  Configuration: "Po naszej stronie cos jest zle skonfigurowane. Prosimy o kontakt.",
};

export default async function BladLogowania({ searchParams }) {
  const p = (await searchParams) || {};
  const opis = OPISY[p.error] || "Logowanie sie nie powiodlo. Sprobuj jeszcze raz.";

  return (
    <div className="wrap sekcja">
      <h1 className="tytul">Nie udalo sie zalogowac</h1>
      <p className="wstep">{opis}</p>
      <p style={{ marginTop: 20 }}>
        <a href="/zaloguj">Wroc do logowania</a>
      </p>
    </div>
  );
}
