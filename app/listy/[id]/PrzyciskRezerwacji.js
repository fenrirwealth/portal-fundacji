"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PrzyciskRezerwacji({ listId, wolny, status }) {
  const [stan, setStan] = useState("gotowy");
  const [blad, setBlad] = useState(null);
  const router = useRouter();

  if (!wolny) {
    const etykieta = {
      ZAREZERWOWANY: "Ten list jest juz zarezerwowany",
      OPLACONY: "Prezent zostal dostarczony",
      PRZEKAZANY: "Prezent zostal przekazany",
    }[status] || "Ten list jest niedostepny";
    return (
      <button className="btn stop" disabled>
        {etykieta}
      </button>
    );
  }

  async function rezerwuj() {
    setStan("czekam");
    setBlad(null);
    try {
      const odp = await fetch("/api/rezerwacja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId }),
      });
      const dane = await odp.json();

      if (odp.status === 403 && dane.wymagaZgody) {
        window.location.href = "/regulamin?wroc=/listy/" + listId;
        return;
      }
      if (odp.status === 401) {
        // Niezalogowany — po powrocie wracamy dokladnie na ten list,
        // zeby nie trzeba bylo szukac go od nowa.
        window.location.href = "/zaloguj?wroc=/listy/" + listId;
        return;
      }
      if (!odp.ok) {
        setBlad(dane.blad || "Nie udalo sie zarezerwowac listu.");
        setStan("gotowy");
        // Konflikt oznacza, ze ktos byl pierwszy — odswiezamy widok,
        // zeby uzytkownik zobaczyl aktualny stan zamiast klikac w pustke.
        if (odp.status === 409) router.refresh();
        return;
      }

      router.push("/moje-rezerwacje?nowa=1");
    } catch {
      setBlad("Brak polaczenia. Sprobuj jeszcze raz.");
      setStan("gotowy");
    }
  }

  return (
    <>
      <button className="btn" onClick={rezerwuj} disabled={stan === "czekam"}>
        {stan === "czekam" ? "Rezerwuje…" : "Rezerwuje ten list"}
      </button>
      {blad && (
        <p role="alert" style={{ color: "var(--czerwien)", fontSize: 13.5, marginTop: 10 }}>
          {blad}
        </p>
      )}
    </>
  );
}
