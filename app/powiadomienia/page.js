import { zapisz, potwierdz, wypisz } from "./actions";
export const metadata = { title: "Powiadomienie o nowych listach", robots: { index: false, follow: false } };
export default async function Powiadomienia({ searchParams }) {
  const p = await searchParams;
  const komunikaty = {
    sprawdz: "Sprawdź pocztę. Kliknij link w wiadomości i potwierdź zapis.",
    gotowe: "Zapis potwierdzony. Wyślemy jedną wiadomość, gdy pojawią się kolejne wolne listy.",
    wypisano: "Zapis został usunięty.",
    blad: "Nie udało się zapisać. Sprawdź adres i spróbuj ponownie.",
  };
  return <div className="wrap sekcja czytanie">
    <h1>Powiadom mnie o nowych listach</h1>
    {komunikaty[p.stan] && <p role="status">{komunikaty[p.stan]}</p>}
    {p.token ? <div>
      <form action={potwierdz}><input type="hidden" name="token" value={p.token}/><button className="btn">Potwierdź zapis</button></form>
      <form action={wypisz}><input type="hidden" name="token" value={p.token}/><button className="btn btn-tekstowy">Usuń mój zapis</button></form>
    </div> : <form action={zapisz} className="formularz-admin">
      <p>Otrzymasz jedną wiadomość o kolejnych dostępnych listach. Zapis potwierdzisz przez e-mail.</p>
      <label>Adres e-mail<input type="email" name="email" autoComplete="email" required maxLength={254}/></label>
      <label className="checkbox"><input type="checkbox" name="zgoda" value="tak" required/> Chcę otrzymać e-mail od Fundacji o kolejnych listach. Mogę usunąć zapis przez link w wiadomości.</label>
      <button className="btn">Wyślij link potwierdzający</button>
    </form>}
  </div>;
}
