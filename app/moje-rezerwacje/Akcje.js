"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../ui/Toast";

/**
 * @param {object} p
 * @param {string} p.id
 * @param {string} p.status
 * @param {string} [p.imie]
 */
export default function Akcje({ id, status, imie = "" }) {
  const [stan, setStan] = useState("gotowy");
  const [pytanie, setPytanie] = useState(false);
  const router = useRouter();
  const toast = useToast();

  if (!["OCZEKUJE", "POTWIERDZONA"].includes(status)) return null;

  async function wyslij(akcja) {
    setStan("czekam");
    try {
      const odp = await fetch("/api/rezerwacja/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ akcja }),
      });
      const dane = await odp.json().catch(() => ({}));
      if (!odp.ok) {
        toast(dane.blad || "Nie udało się wykonać operacji.", "blad");
      } else {
        toast(akcja === "potwierdz" ? "Rezerwacja potwierdzona." : "Rezerwacja anulowana. List wrócił do puli.");
      }
    } catch {
      toast("Brak połączenia. Spróbuj jeszcze raz.", "blad");
    }
    setStan("gotowy");
    setPytanie(false);
    router.refresh();
  }

  return (
    <div style={{ display: "flex", gap: "var(--o-2)", justifyContent: "flex-end", flexWrap: "wrap" }}>
      {status === "OCZEKUJE" && (
        <button className="btn" disabled={stan === "czekam"} aria-busy={stan === "czekam"}
                onClick={() => wyslij("potwierdz")}>
          Potwierdzam
        </button>
      )}

      {/* Rezygnacja to operacja nieodwracalna — list od razu wraca do puli
          i może go zająć ktoś inny. Dlatego potwierdzenie w miejscu,
          bez modala przykrywającego całą stronę. */}
      {!pytanie ? (
        <button className="btn btn-cichy" disabled={stan === "czekam"} onClick={() => setPytanie(true)}>
          Rezygnuję
        </button>
      ) : (
        <span className="rezygnacja" role="group" aria-label={`Potwierdź rezygnację z listu od ${imie}`}>
          <span className="drobny">Na pewno? List wróci do puli.</span>
          <button className="btn btn-cichy" onClick={() => setPytanie(false)}>Nie</button>
          <button className="btn" disabled={stan === "czekam"} aria-busy={stan === "czekam"}
                  onClick={() => wyslij("anuluj")} style={/** @type {any} */ ({ "--btn-tlo": "var(--glina-600)", "--btn-tekst": "var(--papier-50)" })}>
            Tak, rezygnuję
          </button>
        </span>
      )}
    </div>
  );
}
