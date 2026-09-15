"use client";

import { useState } from "react";

export default function KopiujKonto({ konto }) {
  const [skopiowane, setSkopiowane] = useState(false);
  async function kopiuj() {
    await navigator.clipboard.writeText(konto.replaceAll(" ", ""));
    setSkopiowane(true);
    setTimeout(() => setSkopiowane(false), 2500);
  }
  return <button className="btn btn-magiczny btn-duzy" type="button" onClick={kopiuj}>{skopiowane ? "Numer skopiowany ✓" : "Skopiuj numer konta"}</button>;
}
