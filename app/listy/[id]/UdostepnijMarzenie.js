"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "../../ui/Toast";

/** @param {{listId:string, imie:string, wolny:boolean}} props */
export default function UdostepnijMarzenie({ listId, imie, wolny }) {
  const dialog = useRef(null);
  const kontroler = useRef(null);
  const plik = useRef(null);
  const objectUrl = useRef(null);
  const [podglad, setPodglad] = useState("");
  const [blad, setBlad] = useState("");
  const [trwa, setTrwa] = useState(false);
  const toast = useToast();
  useEffect(() => () => { kontroler.current?.abort(); if (objectUrl.current) URL.revokeObjectURL(objectUrl.current); }, []);

  function zamknij() {
    kontroler.current?.abort();
    dialog.current.close();
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = null; plik.current = null;
    setPodglad(""); setBlad(""); setTrwa(false);
  }

  async function przygotuj() {
    dialog.current.showModal();
    setBlad(""); setTrwa(true);
    kontroler.current?.abort();
    const abort = new AbortController();
    kontroler.current = abort;
    try {
      const odpowiedz = await fetch(`/api/listy/${encodeURIComponent(listId)}/story`, { signal: abort.signal, cache: "no-store" });
      if (!odpowiedz.ok || !odpowiedz.headers.get("Content-Type")?.includes("image/png")) throw new Error("GRAFIKA");
      const blob = await odpowiedz.blob();
      if (abort.signal.aborted) return;
      plik.current = new File([blob], `marzenie-${listId}.png`, { type: "image/png" });
      objectUrl.current = URL.createObjectURL(blob);
      setPodglad(objectUrl.current);
    } catch (e) {
      if (e.name !== "AbortError") setBlad("Nie udało się przygotować karty. Spróbuj ponownie.");
    } finally { if (!abort.signal.aborted) setTrwa(false); }
  }

  function pobierz() {
    if (!plik.current || !objectUrl.current) return;
    const a = document.createElement("a"); a.href = objectUrl.current; a.download = plik.current.name;
    document.body.appendChild(a); a.click(); a.remove();
    toast("Karta została przygotowana do pobrania. Dodaj ją do swojej relacji.");
  }

  async function udostepnij() {
    if (!plik.current) return;
    // File already exists: navigator.share runs within a fresh user activation.
    try {
      if (!navigator.canShare?.({ files: [plik.current] })) { pobierz(); return; }
      await navigator.share({ files: [plik.current], title: `Marzenie — ${imie}`, text: wolny ? "Pomóż znaleźć Mikołaja dla tego listu." : "Pomóż znaleźć Mikołaja dla kolejnego listu." });
    } catch (e) {
      if (e.name !== "AbortError") setBlad("Udostępnianie niedostępne. Możesz pobrać kartę przyciskiem poniżej.");
    }
  }
  async function kopiuj() {
    try { await navigator.clipboard.writeText(`${window.location.origin}/listy/${encodeURIComponent(listId)}`); toast("Link do listu skopiowany."); }
    catch { setBlad("Nie można skopiować linku automatycznie. Skopiuj adres z paska przeglądarki."); }
  }
  return <>
    <button className="btn btn-udostepnij btn-pelny" type="button" onClick={przygotuj}><span aria-hidden="true">✦</span> Udostępnij marzenie</button>
    <dialog ref={dialog} className="story-dialog" aria-labelledby="story-tytul" onCancel={(e) => { e.preventDefault(); zamknij(); }}>
      <div className="story-layout">
        <div className="story-podglad" aria-busy={trwa}>
          {podglad ? /* Blob URL, already generated at exactly 1080 × 1920. */
            // eslint-disable-next-line @next/next/no-img-element
            <img src={podglad} width="1080" height="1920" alt={`Karta marzenia: ${imie}, przygotowana do relacji`} />
            : <div className="story-placeholder"><span aria-hidden="true">✦</span><p role="status">{trwa ? "Przygotowujemy Twoją kartę…" : "Podgląd karty"}</p></div>}
        </div>
        <div className="story-opis"><p className="nadtytul">Jedna relacja. Kolejny dobry gest.</p><h2 id="story-tytul">Niech to marzenie<br /><em>poleci dalej.</em></h2><p>Udostępnij kartę w relacji. Kod QR prowadzi do listu — nie musisz ujawniać żadnych dodatkowych danych dziecka.</p>
          {blad && <p role="alert" className="story-blad">{blad}</p>}
          {podglad && <><button className="btn btn-magiczny" onClick={udostepnij}>Udostępnij kartę ↗</button><button className="btn btn-szklany" onClick={pobierz}>Pobierz PNG</button><button className="btn btn-szklany" onClick={kopiuj}>Kopiuj link do listu</button></>}
          {blad && !podglad && <button className="btn btn-magiczny" onClick={przygotuj}>Spróbuj ponownie</button>}
          <button className="story-zamknij" onClick={zamknij}>Zamknij podgląd</button>
        </div>
      </div>
    </dialog>
  </>;
}
