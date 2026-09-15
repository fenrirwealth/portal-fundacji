"use client";

import { useState } from "react";
import { useToast } from "../../ui/Toast";

/** @param {{listId:string, imie:string, wolny:boolean}} props */
export default function UdostepnijMarzenie({ listId, imie, wolny }) {
  const [trwa, setTrwa] = useState(false);
  const toast = useToast();

  async function udostepnij() {
    if (trwa) return;
    setTrwa(true);
    const adresGrafiki = `${window.location.origin}/api/listy/${listId}/story`;
    const adresListu = `${window.location.origin}/listy/${listId}`;

    try {
      const odpowiedz = await fetch(adresGrafiki);
      if (!odpowiedz.ok) throw new Error("GRAFIKA");
      const blob = await odpowiedz.blob();
      const plik = new File([blob], `marzenie-${imie.toLowerCase()}.png`, { type: "image/png" });

      if (navigator.canShare?.({ files: [plik] })) {
        await navigator.share({
          title: wolny ? "To marzenie nadal czeka" : "Ten list ma już Mikołaja",
          text: wolny
            ? "Pomóż znaleźć Mikołaja dla tego wyjątkowego listu."
            : "Zobacz pozostałe listy, które wciąż czekają na swojego Mikołaja.",
          files: [plik],
          url: adresListu,
        });
        return;
      }

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = plik.name;
      link.click();
      URL.revokeObjectURL(link.href);
      await navigator.clipboard?.writeText(adresListu);
      toast("Grafika pobrana. Link do listu jest gotowy do wklejenia.");
    } catch (blad) {
      if (blad?.name !== "AbortError") toast("Nie udało się przygotować grafiki. Spróbuj ponownie.", "blad");
    } finally {
      setTrwa(false);
    }
  }

  return (
    <button className="btn btn-udostepnij btn-pelny" type="button" onClick={udostepnij} disabled={trwa}>
      <span aria-hidden="true">✦</span>
      {trwa ? "Tworzę kartę…" : "Udostępnij marzenie"}
    </button>
  );
}
