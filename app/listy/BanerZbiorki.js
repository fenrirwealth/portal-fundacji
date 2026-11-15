import { TELEFON_FUNDACJI, TELEFON_HREF, ZBIORKA_SIEPOMAGA_HREF } from "../../lib/zasady-akcji.mjs";
import styl from "./BanerZbiorki.module.css";

export default function BanerZbiorki() {
  return (
    <section className={styl.baner} aria-labelledby="zbiorka-tytul">
      <div className={styl.scena} aria-hidden="true">
        <div className={styl.blask} />
      </div>
      <div className={styl.tresc}>
        <h2 id="zbiorka-tytul">Pomóż nam kupić świąteczne prezenty</h2>
        <p>Każda wpłata na naszą zbiórkę na Siepomaga pomaga przygotować prezenty dla dzieci z domów dziecka i rodzin zastępczych.</p>
        <a href={ZBIORKA_SIEPOMAGA_HREF} className="btn btn-magiczny">Wesprzyj zbiórkę na Siepomaga</a>
        <p>Więcej informacji pod numerem <a className={styl.telefon} href={TELEFON_HREF}>{TELEFON_FUNDACJI}</a>.</p>
      </div>
    </section>
  );
}
