import { notFound } from "next/navigation";
import { db } from "../../../../lib/db";
import { hashTokena } from "../../../../lib/skany";
import FormularzSkanow from "./FormularzSkanow";

export const dynamic = "force-dynamic";
export const metadata = { title: "Prześlij listy", robots: { index: false, follow: false } };

export default async function PrzeslijListy({ params }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) notFound();
  const udzial = await db.udzialPlacowki.findFirst({
    where: {
      tokenPrzesylaniaHash: hashTokena(token), tokenPrzesylaniaWygasa: { gt: new Date() },
      status: "POTWIERDZILA", edycja: { aktywna: true },
    },
    include: { placowka: { select: { nazwa: true } }, _count: { select: { skany: true } } },
  });
  if (!udzial) notFound();

  return (
    <div className="wrap sekcja"><div className="panel-przesylania">
      <p className="nadtytul nadtytul-ciemny"><span /> Strefa placówki</p>
      <h1>Prześlij listy bez danych ukrytych w plikach.</h1>
      <p className="czytanie cichy">{udzial.placowka.nazwa} · przesłano dotąd: {udzial._count.skany}</p>
      <div className="ochrona-skany">
        <b>Co robimy automatycznie?</b>
        <p>Usuwamy EXIF, GPS, miniatury i nazwę oryginalnego pliku. Obraz zmniejszamy do bezpiecznego formatu i zapisujemy poza publiczną częścią portalu.</p>
      </div>
      <FormularzSkanow token={token} nazwa={udzial.placowka.nazwa} />
      <p className="drobny cichy">Przed publikacją każdy list przechodzi ręczną kontrolę Fundacji. Nie przesyłaj dokumentacji medycznej ani wizerunku dziecka.</p>
    </div></div>
  );
}
