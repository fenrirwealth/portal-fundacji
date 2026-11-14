"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function OdswiezStatusy() {
  const router = useRouter();
  const ostatnie = useRef(Date.now());

  useEffect(() => {
    function odswiez() {
      if (document.hidden || Date.now() - ostatnie.current < 2000) return;
      ostatnie.current = Date.now();
      router.refresh();
    }

    function przywroc(event) {
      if (event.persisted) {
        ostatnie.current = 0;
        odswiez();
      }
    }

    const zegar = window.setInterval(odswiez, 30000);
    document.addEventListener("visibilitychange", odswiez);
    window.addEventListener("focus", odswiez);
    window.addEventListener("pageshow", przywroc);
    return () => {
      window.clearInterval(zegar);
      document.removeEventListener("visibilitychange", odswiez);
      window.removeEventListener("focus", odswiez);
      window.removeEventListener("pageshow", przywroc);
    };
  }, [router]);

  return null;
}
