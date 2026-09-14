import { signIn } from "../../auth";
import { bezpiecznaSciezka } from "../../lib/db";

export const metadata = {
  title: "Zaloguj sie",
  robots: { index: false, follow: false },
};

export default async function Zaloguj({ searchParams }) {
  const p = (await searchParams) || {};
  const wroc = bezpiecznaSciezka(p.wroc);

  return (
    <div className="wrap sekcja">
      <h1 className="tytul">Zaloguj sie</h1>
      <p className="wstep">
        Nie zakladamy hasel. Podaj adres e-mail, a wyslemy na niego link
        do logowania. Tego samego adresu uzyjemy do kontaktu w sprawie
        rezerwacji.
      </p>

      <form
        action={async (formData) => {
          "use server";
          // Adres normalizuje adapter Auth.js, wiec nie powielamy tego tutaj.
          await signIn("nodemailer", {
            email: formData.get("email"),
            // Filtrujemy takze tutaj: pole formularza jest danymi
            // od uzytkownika, nie zaufanym parametrem.
            redirectTo: bezpiecznaSciezka(formData.get("wroc")),
          });
        }}
        style={{ maxWidth: 420, marginTop: 26 }}
      >
        <input type="hidden" name="wroc" value={wroc} />

        <label htmlFor="email">Adres e-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="anna@example.com"
          style={{
            width: "100%",
            border: "1px solid var(--linia2)",
            borderRadius: 3,
            padding: "11px 12px",
            font: "15px 'IBM Plex Sans', sans-serif",
            marginBottom: 16,
            background: "var(--biel)",
            color: "var(--atrament)",
          }}
        />

        <button className="btn" type="submit">Wyslij link do logowania</button>
      </form>

      <p style={{ fontSize: 13, color: "var(--atrament2)", marginTop: 18, maxWidth: "52ch" }}>
        Link jest wazny 30 minut i dziala jeden raz. Jesli korzystasz ze
        wspoldzielonego komputera, wyloguj sie po zakonczeniu.
      </p>
    </div>
  );
}
