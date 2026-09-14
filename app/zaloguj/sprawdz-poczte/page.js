export const metadata = {
  title: "Sprawdz poczte",
  robots: { index: false, follow: false },
};

export default function SprawdzPoczte() {
  return (
    <div className="wrap sekcja">
      <h1 className="tytul">Sprawdz poczte</h1>
      <p className="wstep">
        Wyslalismy link do logowania. Kliknij go w ciagu 30 minut — po tym
        czasie przestanie dzialac i trzeba bedzie poprosic o nowy.
      </p>
      <p className="wstep">
        Jesli wiadomosc nie dotarla w ciagu kilku minut, zajrzyj do folderu
        ze spamem. Zdarza sie, ze pierwsza wiadomosc z nowej domeny tam trafia.
      </p>
      <p style={{ marginTop: 20 }}>
        <a href="/zaloguj">Wyslij link jeszcze raz</a>
      </p>
    </div>
  );
}
