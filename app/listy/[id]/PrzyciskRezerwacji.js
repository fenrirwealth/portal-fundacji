"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../../ui/Toast";

/**
 * @param {object} p
 * @param {string} p.listId
 * @param {boolean} p.wolny
 * @param {string} p.status
 * @param {boolean} [p.zwiezly] wariant do paska mobilnego
 */
export default function PrzyciskRezerwacji({ listId, wolny, status, zwiezly = false }) {
  const [stan, setStan] = useState("gotowy");
  const router = useRouter();
  const toast = useToast();

  if (!wolny) {
    return (
      <button className={"btn" + (zwiezly ? "" : " btn-pelny")} disabled aria-disabled="true">
        {status === "ZAREZERWOWANY" ? "Już zarezerwowany" : "Prezent przekazany"}
      </button>
    );
  }

  async function rezerwuj() {
    setStan("czekam");
    try {
      const odp = await fetch("/api/rezerwacja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId }),
      });
      const dane = await odp.json();

      if (odp.status === 403 && dane.wymagaZgody) {
        router.push("/regulamin?wroc=/listy/" + listId);
        return;
      }
      if (odp.status === 401) {
        // Po zalogowaniu wracamy dokładnie na ten list, żeby nie trzeba
        // go było szukać od nowa.
        router.push("/zaloguj?wroc=/listy/" + listId);
        return;
      }
      if (!odp.ok) {
        toast(dane.blad || "Nie udało się zarezerwować listu.", "blad");
        setStan("gotowy");
        // Konflikt oznacza, że ktoś był pierwszy — odświeżamy widok,
        // żeby użytkownik zobaczył aktualny stan zamiast klikać w pustkę.
        if (odp.status === 409) router.refresh();
        return;
      }

      router.push("/moje-rezerwacje?nowa=1");
    } catch {
      toast("Brak połączenia. Spróbuj jeszcze raz.", "blad");
      setStan("gotowy");
    }
  }

  return (
    <button
      className={"btn" + (zwiezly ? "" : " btn-pelny btn-duzy")}
      onClick={rezerwuj}
      disabled={stan === "czekam"}
      aria-busy={stan === "czekam"}
    >
      {stan === "czekam" ? "Rezerwuję…" : zwiezly ? "Rezerwuję" : "Rezerwuję ten list"}
    </button>
  );
}
