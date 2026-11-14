import Link from "next/link";
import styl from "./BanerKolejneListy.module.css";

export default function BanerKolejneListy() {
  return (
    <section className={styl.baner} aria-labelledby="kolejne-listy-tytul">
      <div className={styl.scena} aria-hidden="true">
        <div className={styl.blask} />
      </div>
      <div className={styl.tresc}>
        <h2 id="kolejne-listy-tytul">Kolejne listy już wkrótce</h2>
        <p><strong>Akcja trwa.</strong> Opublikujemy kolejne listy do Mikołaja. Zajrzyjcie tu ponownie.</p>
        <p>Dziękujemy wszystkim, którzy już zarezerwowali listy!</p>
        <Link href="/powiadomienia" className="btn btn-magiczny">Powiadom mnie o nowych listach</Link>
      </div>
    </section>
  );
}
