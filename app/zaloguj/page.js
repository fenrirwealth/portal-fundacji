import { signIn } from "../../auth";
import { bezpiecznaSciezka } from "../../lib/db";
import Pole from "../ui/Pole";

export const metadata = { title: "Zaloguj się", robots: { index: false, follow: false } };

export default async function Zaloguj({ searchParams }) {
  const p = (await searchParams) || {};
  const wroc = bezpiecznaSciezka(p.wroc);

  return (
    <div className="wrap sekcja">
      <div className="waski" style={{ marginInline: "auto" }}>
        <h1 style={{ fontSize: "var(--t-2xl)" }}>Zaloguj się</h1>
        <p className="cichy" style={{ marginTop: "var(--o-3)" }}>
          Nie zakładamy haseł. Podaj adres e-mail, a wyślemy na niego link
          do logowania. Tego samego adresu użyjemy do kontaktu w sprawie akcji.
        </p>

        <form
          action={async (formData) => {
            "use server";
            await signIn("nodemailer", {
              email: formData.get("email"),
              // Filtrujemy także tutaj: pole formularza jest danymi
              // od użytkownika, nie zaufanym parametrem.
              redirectTo: bezpiecznaSciezka(formData.get("wroc")),
            });
          }}
          style={{ marginTop: "var(--o-6)" }}
        >
          <input type="hidden" name="wroc" value={wroc} />

          <Pole
            id="email"
            name="email"
            typ="email"
            etykieta="Adres e-mail"
            wymagane
            autoComplete="email"
            placeholder="anna@example.com"
            podpowiedz="Link jest ważny 30 minut i działa jeden raz."
          />

          <button className="btn btn-pelny btn-duzy" type="submit">
            Wyślij link do logowania
          </button>
        </form>

        <p className="drobny cichy" style={{ marginTop: "var(--o-5)" }}>
          Jeśli korzystasz ze wspólnego komputera, pamiętaj o wylogowaniu —
          przycisk jest w nagłówku.
        </p>
      </div>
    </div>
  );
}
