"use client";
import Image from "next/image";
import { useState } from "react";
import { adresyZdjeciaListu } from "../../../lib/zdjecie-listu-admin.mjs";

export default function MiniaturaListu({ id, numer, imie, zdjecieUrl }) {
  const [blad, setBlad] = useState(false);
  const adresy = adresyZdjeciaListu(id, zdjecieUrl);
  if (!adresy || blad) return <span className="miniatura-listu-brak">Brak zdjęcia</span>;
  return <a className="miniatura-listu" href={adresy.pelny} target="_blank" rel="noreferrer" title={`Powiększ list nr ${numer}: ${imie}`}>
    <Image src={adresy.miniatura} alt={`Powiększ zdjęcie listu nr ${numer}: ${imie}`} width={72} height={96} unoptimized onError={() => setBlad(true)} />
    <span>Powiększ</span>
  </a>;
}
