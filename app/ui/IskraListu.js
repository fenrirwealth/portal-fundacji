"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import styl from "./KartaListu.module.css";

export default function IskraListu() {
  const element = useRef(null);
  const [widoczna, ustawWidoczna] = useState(false);

  useEffect(() => {
    if (!element.current || typeof IntersectionObserver === "undefined") return;
    const obserwator = new IntersectionObserver(([wpis]) => {
      if (wpis.isIntersecting) {
        ustawWidoczna(true);
        obserwator.disconnect();
      }
    });
    obserwator.observe(element.current);
    return () => obserwator.disconnect();
  }, []);

  return (
    <span ref={element} className={styl.iskra} data-widoczna={widoczna} aria-hidden="true">
      <Sparkles size={15} />
    </span>
  );
}
