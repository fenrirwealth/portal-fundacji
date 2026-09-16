"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const LISTY = Array.from({ length: 9 }, (_, i) => ({
  src: `/archiwum/listy/list-${String(i + 1).padStart(2, "0")}.webp`,
  alt: `Odręczny list do Świętego Mikołaja z poprzedniej edycji, karta ${i + 1}`,
}));

export default function ArchiwumListow() {
  const dialog = useRef(null);
  const [wybrany, setWybrany] = useState(null);

  useEffect(() => {
    const modal = dialog.current;
    if (wybrany === null) {
      if (modal?.open) modal.close();
      return;
    }
    if (!modal.open) modal.showModal();
  }, [wybrany]);

  return <>
    <div className="archiwum-listow" aria-label="Galeria listów z poprzednich edycji">
      {LISTY.map((list, i) => (
        <button
          type="button"
          className="archiwum-karta"
          key={list.src}
          onClick={() => setWybrany(i)}
          aria-label={`Powiększ list ${i + 1}`}
        >
          <Image src={list.src} alt={list.alt} fill sizes="(max-width: 700px) 64vw, 270px" />
          <span aria-hidden="true">Zajrzyj do listu <b>↗</b></span>
        </button>
      ))}
    </div>

    <dialog className="archiwum-dialog" ref={dialog} onClose={() => setWybrany(null)}>
      {wybrany !== null && <div className="archiwum-dialog-tresc">
        <Image src={LISTY[wybrany].src} alt={LISTY[wybrany].alt} fill sizes="min(90vw, 760px)" priority />
        <button type="button" onClick={() => setWybrany(null)} aria-label="Zamknij podgląd listu">Zamknij <span aria-hidden="true">×</span></button>
        <p>Autentyczny list z poprzedniej edycji akcji.</p>
      </div>}
    </dialog>
  </>;
}
