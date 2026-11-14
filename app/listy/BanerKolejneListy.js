import styl from "./BanerKolejneListy.module.css";

export default function BanerKolejneListy() {
  return (
    <section className={styl.baner} aria-labelledby="kolejne-listy-tytul">
      <div className={styl.scena} aria-hidden="true">
        <div className={styl.blask} />
      </div>
      <div className={styl.tresc}>
        <h2 id="kolejne-listy-tytul">Dziękujemy za rezerwacje listów!</h2>
        <p>Dzięki Wam kolejne dziecięce marzenia są bliżej spełnienia.</p>
        <p><strong>Już za kilka dni pojawią się tu kolejne listy.</strong> Zajrzyjcie do nas ponownie. Być może jedno z tych marzeń czeka właśnie na Was.</p>
      </div>
    </section>
  );
}
