import Link from "next/link";
import { rezerwujListRecznie, usunListZPanelu, zwolnijRezerwacjeListu } from "../actions";
import PrzyciskOperacji from "./PrzyciskOperacji";

export default function SzybkieAkcje({ list, pokazEdycje = true }) {
  const wersja = list.zaktualizowany.toISOString();
  return <div className="szybkie-akcje-listu">
    {pokazEdycje && <Link className="btn drugorzedny" href={"/admin/listy/" + list.id}>Edytuj</Link>}
    {list.status === "OPUBLIKOWANY" && <details>
      <summary className="btn">Zarezerwuj ręcznie</summary>
      <form action={rezerwujListRecznie} className="szybka-operacja">
        <input type="hidden" name="id" value={list.id} /><input type="hidden" name="wersja" value={wersja} />
        <p className="drobny">Oznaczysz list jako zarezerwowany przez Fundację. Taka rezerwacja nie wygasa po 48 godzinach.</p>
        <label className="drobny">Zarezerwował(a) (opcjonalnie)
          <input name="darczynca" className="pole-kontrolka" maxLength={120} placeholder="Imię, nazwisko lub firma" />
        </label>
        <label className="drobny">Notatka wewnętrzna (opcjonalna)<textarea name="notatka" className="pole-kontrolka" rows={2} maxLength={500} placeholder="Np. prezent przygotowuje firma — szczegóły uzgodnione telefonicznie" /></label>
        <PrzyciskOperacji>Oznacz jako zarezerwowany</PrzyciskOperacji>
      </form>
    </details>}
    {list.status === "ZAREZERWOWANY" && <details>
      <summary className="btn drugorzedny">Zwolnij rezerwację</summary>
      <form action={zwolnijRezerwacjeListu} className="szybka-operacja">
        <input type="hidden" name="id" value={list.id} /><input type="hidden" name="wersja" value={wersja} />
        <p className="drobny">List wróci do puli. Jeśli ma darczyńcę, najpierw uzgodnij z nim rezygnację.</p>
        <PrzyciskOperacji>Zwolnij list</PrzyciskOperacji>
      </form>
    </details>}
    {["SZKIC", "DO_POPRAWY", "OPUBLIKOWANY"].includes(list.status) && <details>
      <summary className="btn niebezpieczny">Usuń</summary>
      <form action={usunListZPanelu} className="szybka-operacja">
        <input type="hidden" name="id" value={list.id} /><input type="hidden" name="wersja" value={wersja} />
        <p className="drobny">List zniknie ze strony i trafi do archiwum. W razie pomyłki możesz go przywrócić.</p>
        <PrzyciskOperacji className="btn niebezpieczny">Usuń list do archiwum</PrzyciskOperacji>
      </form>
    </details>}
    {list.status === "WYCOFANY" && <Link className="btn drugorzedny" href={"/admin/listy/" + list.id}>Przywróć z archiwum</Link>}
  </div>;
}
