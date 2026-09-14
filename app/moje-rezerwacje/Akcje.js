"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Akcje({ id, status }) {
  const [stan, setStan] = useState("gotowy");
  const router = useRouter();

  if (!["OCZEKUJE", "POTWIERDZONA"].includes(status)) return null;

  async function wyslij(akcja) {
    setStan("czekam");
    await fetch("/api/rezerwacja/" + id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ akcja }),
    });
    setStan("gotowy");
    router.refresh();
  }

  return (
    <>
      {status === "OCZEKUJE" && (
        <button className="btn" style={{ width: "auto", padding: "7px 14px", fontSize: 13 }}
                disabled={stan === "czekam"} onClick={() => wyslij("potwierdz")}>
          Potwierdzam
        </button>
      )}
      <button
        className="btn"
        style={{ width: "auto", padding: "7px 14px", fontSize: 13, marginLeft: 8,
                 background: "none", border: "1px solid var(--linia2)", color: "var(--atrament)" }}
        disabled={stan === "czekam"}
        onClick={() => wyslij("anuluj")}
      >
        Rezygnuje
      </button>
    </>
  );
}
