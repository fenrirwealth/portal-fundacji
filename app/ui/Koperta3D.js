"use client";

import { useEffect, useRef, useState } from "react";

function czyLekkiTryb() {
  if (typeof window === "undefined") return true;
  const mniejRuchu = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const malyEkran = window.matchMedia("(max-width: 760px)").matches;
  const polaczenie = /** @type {any} */ (navigator).connection;
  const slabePolaczenie = polaczenie?.saveData || /(^|-)2g$/.test(polaczenie?.effectiveType || "");
  return mniejRuchu || malyEkran || slabePolaczenie;
}

export default function Koperta3D() {
  const kontener = useRef(null);
  const [lekkiTryb, setLekkiTryb] = useState(true);

  useEffect(() => {
    const klatka = requestAnimationFrame(() => setLekkiTryb(czyLekkiTryb()));
    return () => cancelAnimationFrame(klatka);
  }, []);

  useEffect(() => {
    if (lekkiTryb || !kontener.current) return undefined;

    const element = kontener.current;
    let zatrzymane = false;
    let klatka = 0;
    let renderer;
    const cel = { x: 0, y: 0 };

    import("three").then((THREE) => {
      if (zatrzymane || !element) return;

      const scena = new THREE.Scene();
      const kamera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
      kamera.position.set(0, 0.15, 6.4);

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
      renderer.setClearColor(0x000000, 0);
      element.appendChild(renderer.domElement);

      const grupa = new THREE.Group();
      scena.add(grupa);

      const papier = new THREE.MeshStandardMaterial({ color: 0xf3e5cb, roughness: 0.76, metalness: 0.02 });
      const papierCien = new THREE.MeshStandardMaterial({ color: 0xdcc9a7, roughness: 0.82 });
      const zloto = new THREE.MeshStandardMaterial({ color: 0xd5ae62, roughness: 0.28, metalness: 0.58 });

      const korpus = new THREE.Mesh(new THREE.BoxGeometry(3.7, 2.28, 0.14), papier);
      grupa.add(korpus);

      const klapa = new THREE.Mesh(new THREE.ConeGeometry(2.14, 1.55, 3), papierCien);
      klapa.rotation.z = Math.PI;
      klapa.rotation.x = -0.16;
      klapa.position.set(0, 0.35, 0.13);
      klapa.scale.set(1.08, 1, 0.05);
      grupa.add(klapa);

      const pieczec = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.09, 48), zloto);
      pieczec.rotation.x = Math.PI / 2;
      pieczec.position.set(0, -0.08, 0.23);
      grupa.add(pieczec);

      const symbol = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 12, 40), papier);
      symbol.position.set(0, -0.08, 0.3);
      grupa.add(symbol);

      const liczba = 520;
      const punkty = new Float32Array(liczba * 3);
      for (let i = 0; i < liczba; i += 1) {
        punkty[i * 3] = (Math.random() - 0.5) * 11;
        punkty[i * 3 + 1] = (Math.random() - 0.5) * 7;
        punkty[i * 3 + 2] = (Math.random() - 0.5) * 5;
      }
      const geometria = new THREE.BufferGeometry();
      geometria.setAttribute("position", new THREE.BufferAttribute(punkty, 3));
      const snieg = new THREE.Points(
        geometria,
        new THREE.PointsMaterial({ color: 0xfff9f0, size: 0.025, transparent: true, opacity: 0.72 })
      );
      scena.add(snieg);

      scena.add(new THREE.AmbientLight(0xfff3dc, 1.8));
      const swiatlo = new THREE.PointLight(0xd5ae62, 28, 15);
      swiatlo.position.set(2.8, 3.2, 4.5);
      scena.add(swiatlo);

      const rozmiar = () => {
        const { width, height } = element.getBoundingClientRect();
        renderer.setSize(width, height, false);
        kamera.aspect = width / Math.max(height, 1);
        kamera.updateProjectionMatrix();
      };
      rozmiar();
      const obserwator = new ResizeObserver(rozmiar);
      obserwator.observe(element);

      const ruch = (e) => {
        const prostokat = element.getBoundingClientRect();
        if (!prostokat) return;
        cel.x = ((e.clientX - prostokat.left) / prostokat.width - 0.5) * 0.26;
        cel.y = ((e.clientY - prostokat.top) / prostokat.height - 0.5) * 0.18;
      };
      element.addEventListener("pointermove", ruch, { passive: true });

      const start = performance.now();
      const animuj = (czas) => {
        if (zatrzymane) return;
        const t = (czas - start) / 1000;
        grupa.rotation.y += (cel.x - grupa.rotation.y) * 0.045;
        grupa.rotation.x += (-cel.y - grupa.rotation.x) * 0.045;
        grupa.position.y = Math.sin(t * 0.8) * 0.08;
        snieg.rotation.y = t * 0.018;
        const pozycje = snieg.geometry.attributes.position.array;
        for (let i = 1; i < pozycje.length; i += 3) {
          pozycje[i] -= 0.0025;
          if (pozycje[i] < -3.5) pozycje[i] = 3.5;
        }
        snieg.geometry.attributes.position.needsUpdate = true;
        renderer.render(scena, kamera);
        klatka = requestAnimationFrame(animuj);
      };
      klatka = requestAnimationFrame(animuj);

      const widocznosc = () => {
        if (document.hidden) cancelAnimationFrame(klatka);
        else klatka = requestAnimationFrame(animuj);
      };
      document.addEventListener("visibilitychange", widocznosc);

      element.__sprzatanie3d = () => {
        document.removeEventListener("visibilitychange", widocznosc);
        element.removeEventListener("pointermove", ruch);
        obserwator.disconnect();
        geometria.dispose();
        korpus.geometry.dispose();
        klapa.geometry.dispose();
        pieczec.geometry.dispose();
        symbol.geometry.dispose();
        papier.dispose();
        papierCien.dispose();
        zloto.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    });

    return () => {
      zatrzymane = true;
      cancelAnimationFrame(klatka);
      element?.__sprzatanie3d?.();
    };
  }, [lekkiTryb]);

  return (
    <div className="koperta-scena" aria-hidden="true">
      {lekkiTryb ? (
        <div className="koperta-css">
          <span className="koperta-klapa" />
          <span className="koperta-pieczec">✦</span>
        </div>
      ) : (
        <div className="koperta-webgl" ref={kontener} />
      )}
    </div>
  );
}
