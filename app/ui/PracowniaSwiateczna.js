'use client';
import Image from 'next/image';
import { useState } from 'react';
export default function PracowniaSwiateczna() {
  const [pauza, ustawPauze] = useState(false);
  return <section className={`pracownia-swiateczna${pauza ? ' pracownia-pauza' : ''}`} aria-label="Świąteczna pracownia Mikołaja">
    <div className="pracownia-kadr">
      <Image src="/api/dekoracje/pracownia?v=1" alt="Świąteczna scena: Mikołaj czyta list, a elfy pakują prezenty przy drewnianym stole." fill sizes="(max-width: 700px) 100vw, 1280px" unoptimized />
      <div className="pracownia-blask" aria-hidden="true" />
      <div className="pracownia-pyl" aria-hidden="true">{Array.from({length:12},(_,i)=><span key={i} style={{left:`${7+i*7.6}%`,animationDelay:`${i*-.7}s`,animationDuration:`${7+i%4}s`}} />)}</div>
      <span className="pracownia-edycja">5. edycja · Magia pomagania</span>
      <button type="button" className="pracownia-pauza-przycisk" onClick={()=>ustawPauze(!pauza)} aria-pressed={pauza}>{pauza ? 'Wznów animację' : 'Wstrzymaj animację'}</button>
    </div>
    <div className="pracownia-podpis"><span aria-hidden="true">✦</span><div><h2>Każdy prezent zaczyna się od listu.</h2><p>Najpiękniejszą część tej historii możesz dopisać Ty.</p></div></div>
  </section>;
}
