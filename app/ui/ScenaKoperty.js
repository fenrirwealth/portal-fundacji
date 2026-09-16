"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

// Seeded particles: reproducible visuals, no allocations in the frame loop.
export function Czasteczki() {
  const ref = useRef(null);
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(1050 * 3);
    const colors = new Float32Array(1050 * 3);
    for (let i = 0; i < 1050; i++) {
      const n = Math.sin(i * 127.1 + 311.7) * 43758.5453;
      positions[i * 3] = ((n - Math.floor(n)) - .5) * 12;
      positions[i * 3 + 1] = (((i * .61803398875) % 1) - .5) * 8;
      positions[i * 3 + 2] = (((i * .41421) % 1) - .5) * 5;
      const c = new THREE.Color(i % 4 === 0 ? "#D5AE62" : "#FFF9F0");
      colors.set([c.r, c.g, c.b], i * 3);
    }
    return { positions, colors };
  }, []);
  useFrame(({ clock, pointer }, delta) => {
    const p = ref.current.geometry.attributes.position;
    const dt = Math.min(delta, .04);
    for (let i = 0; i < p.count; i++) {
      let y = p.getY(i) - dt * (.1 + (i % 7) * .035);
      if (y < -4) y = 4;
      // Analytic curl-like flow around the pointer (not a fluid solver).
      const dx = p.getX(i) - pointer.x * 4;
      const dy = y - pointer.y * 3;
      const wir = .12 / (1 + dx * dx + dy * dy);
      const x = p.getX(i) + Math.sin(clock.elapsedTime * .3 + y + i) * dt * .04 - dy * wir * dt;
      y += dx * wir * dt;
      p.setXYZ(i, x > 6 ? -6 : x < -6 ? 6 : x, y, p.getZ(i));
    }
    p.needsUpdate = true;
  });
  return <points ref={ref}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /><bufferAttribute attach="attributes-color" args={[colors, 3]} /></bufferGeometry><pointsMaterial size={.027} vertexColors transparent opacity={.75} depthWrite={false} blending={THREE.AdditiveBlending} /></points>;
}

function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - 2 ** (-10 * t);
}

/** Złoty impuls uruchamiany w chwili pęknięcia laku. */
export function MagicznyWybuch({ otwarta }) {
  const punkty = useRef(null);
  const material = useRef(null);
  const pierscien = useRef(null);
  const postep = useRef(0);
  const { start, kierunki } = useMemo(() => {
    const start = new Float32Array(260 * 3);
    const kierunki = new Float32Array(260 * 3);
    for (let i = 0; i < 260; i++) {
      const a = ((i * 137.508) * Math.PI) / 180;
      const r = .06 + (i % 13) * .009;
      start.set([Math.cos(a) * r, -.08 + Math.sin(i * 2.13) * .055, .42], i * 3);
      const moc = .65 + (i % 17) / 13;
      kierunki.set([Math.cos(a) * moc, Math.sin(a) * moc * .72 + .28, (i % 7) * .055], i * 3);
    }
    return { start, kierunki };
  }, []);
  useFrame((_, delta) => {
    const dt = Math.min(delta, .04);
    postep.current = THREE.MathUtils.damp(postep.current, otwarta ? 1 : 0, otwarta ? 2.7 : 7, dt);
    const p = postep.current;
    const e = easeOutExpo(Math.min(1, p));
    const pozycje = punkty.current.geometry.attributes.position;
    for (let i = 0; i < pozycje.count; i++) {
      const o = i * 3;
      pozycje.setXYZ(i, start[o] + kierunki[o] * e * 2.45, start[o + 1] + kierunki[o + 1] * e * 2.45 - p * p * .75, start[o + 2] + kierunki[o + 2] * e);
    }
    pozycje.needsUpdate = true;
    material.current.opacity = Math.max(0, Math.sin(Math.min(1, p) * Math.PI) * .95);
    const skala = .2 + e * 3.5;
    pierscien.current.scale.setScalar(skala);
    pierscien.current.material.opacity = Math.max(0, (1 - p) * .72);
  });
  return <group position={[0, -.05, .42]}>
    <points ref={punkty}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[start.slice(), 3]} /></bufferGeometry>
      <pointsMaterial ref={material} color="#ffd982" size={.065} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
    <mesh ref={pierscien} scale={.2} rotation={[0,0,.12]}>
      <torusGeometry args={[.46,.012,8,96]} />
      <meshBasicMaterial color="#ffe7a8" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  </group>;
}

function KinowyRig({ otwarta }) {
  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, .04);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, otwarta ? 6.45 : 7.5, 2.8, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, otwarta ? .18 : 0, 2.8, dt);
    camera.lookAt(0, otwarta ? .14 : 0, 0);
  });
  return null;
}

export function List({ otwarta, przechyl }) {
  const grupa = useRef(null);
  const klapa = useRef(null);
  const list = useRef(null);
  const swiatlo = useRef(null);
  const listMaterial = useRef(null);
  const lakLewy = useRef(null);
  const lakPrawy = useRef(null);
  const postep = useRef(0);
  const ksztalt = useMemo(() => {
    const s = new THREE.Shape(); s.moveTo(-1.8, 0); s.lineTo(1.8, 0); s.lineTo(0, -1.35); s.closePath(); return s;
  }, []);
  const papier = useMemo(() => {
    const canvas = document.createElement("canvas"); canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d"); ctx.fillStyle = "#f3e5cb"; ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 9000; i++) { ctx.fillStyle = `rgba(120,88,51,${(i % 5) / 100})`; ctx.fillRect((i * 71) % 256, (i * 113 + Math.floor(i / 256)) % 256, 1, 2); }
    const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, []);
  useEffect(() => () => papier.dispose(), [papier]);
  useFrame(({ pointer, clock }, delta) => {
    const dt = Math.min(delta, .04);
    const cel = przechyl || pointer;
    postep.current = THREE.MathUtils.damp(postep.current, otwarta ? 1 : 0, otwarta ? 2.55 : 5.5, dt);
    const p = postep.current;
    const reveal = easeOutExpo(Math.min(1, p));
    grupa.current.rotation.y = THREE.MathUtils.damp(grupa.current.rotation.y, cel.x * .18 - .08, 4, dt);
    grupa.current.rotation.x = THREE.MathUtils.damp(grupa.current.rotation.x, -cel.y * .1 + (otwarta ? -.03 : .06), 4, dt);
    grupa.current.rotation.z = THREE.MathUtils.damp(grupa.current.rotation.z, otwarta ? 0 : -.045, 3.5, dt);
    grupa.current.position.y = Math.sin(clock.elapsedTime * .7) * .055 - p * .08;
    const skala = 1 + Math.sin(Math.min(1, p) * Math.PI) * .075;
    grupa.current.scale.setScalar(skala);
    klapa.current.rotation.x = THREE.MathUtils.damp(klapa.current.rotation.x, otwarta ? -2.92 : -.035, 3.4, dt);
    list.current.position.y = THREE.MathUtils.damp(list.current.position.y, otwarta ? 1.42 : .06, 2.7, dt);
    list.current.position.z = THREE.MathUtils.damp(list.current.position.z, otwarta ? .62 : .01, 3, dt);
    list.current.rotation.z = THREE.MathUtils.damp(list.current.rotation.z, otwarta ? -.025 : .018, 3, dt);
    list.current.scale.setScalar(.94 + reveal * .1);
    swiatlo.current.intensity = THREE.MathUtils.damp(swiatlo.current.intensity, otwarta ? 20 : 1.5, 3.6, dt);
    listMaterial.current.emissiveIntensity = .08 + Math.sin(Math.min(1, p) * Math.PI) * .48;
    lakLewy.current.position.x = -.08 - reveal * .32;
    lakPrawy.current.position.x = .08 + reveal * .32;
    lakLewy.current.rotation.z = -reveal * .85;
    lakPrawy.current.rotation.z = Math.PI + reveal * .85;
    lakLewy.current.scale.setScalar(1 - reveal * .22);
    lakPrawy.current.scale.setScalar(1 - reveal * .22);
  });
  return <group ref={grupa} rotation={[.06, -.1, -.045]}>
    <mesh position={[0, 0, -.06]}><boxGeometry args={[3.65, 2.3, .09]} /><meshStandardMaterial map={papier} roughness={.92} /></mesh>
    <group ref={list} position={[0, .06, .01]} rotation={[0,0,.018]}>
      <mesh><boxGeometry args={[3.2, 2.05, .025]} /><meshStandardMaterial ref={listMaterial} color="#fff9f0" emissive="#d8a243" emissiveIntensity={.08} map={papier} roughness={.82} /></mesh>
      <mesh position={[0,.42,.026]}><torusGeometry args={[.18,.012,8,48]} /><meshStandardMaterial color="#D5AE62" metalness={.75} roughness={.25} /></mesh>
      <mesh position={[0,.42,.032]} rotation={[0,0,Math.PI/4]}><boxGeometry args={[.095,.095,.012]} /><meshStandardMaterial color="#D5AE62" metalness={.7} roughness={.22} /></mesh>
      {[.08,-.15,-.38].map((y,i) => <mesh key={y} position={[0,y,.027]}><boxGeometry args={[i === 2 ? 1.45 : 1.9,.018,.008]} /><meshBasicMaterial color="#8f775c" transparent opacity={.42 - i * .06} /></mesh>)}
    </group>
    <mesh position={[0, -.25, .07]}><boxGeometry args={[3.65, 1.8, .06]} /><meshStandardMaterial map={papier} roughness={.8} /></mesh>
    {[[-1.66, 0, .015, 1.95], [1.66, 0, .015, 1.95], [0, -.96, 3.33, .015], [0, .96, 3.33, .015]].map(([x,y,w,h], i) => <mesh key={i} position={[x,y,.115]}><boxGeometry args={[w,h,.007]} /><meshStandardMaterial color="#D5AE62" metalness={.85} roughness={.25} /></mesh>)}
    <group name="klapa" ref={klapa} position={[0, 1.13, .13]}>
      <mesh><shapeGeometry args={[ksztalt]} /><meshStandardMaterial map={papier} side={THREE.DoubleSide} roughness={.8} /></mesh>
      <group position={[0,-1.06,.09]}>
        <mesh ref={lakLewy} position={[-.08,0,0]}><circleGeometry args={[.31,48,Math.PI / 2,Math.PI]} /><meshStandardMaterial color="#7B1830" roughness={.28} metalness={.16} side={THREE.DoubleSide} /></mesh>
        <mesh ref={lakPrawy} position={[.08,0,.002]} rotation={[0,0,Math.PI]}><circleGeometry args={[.31,48,Math.PI / 2,Math.PI]} /><meshStandardMaterial color="#8d203a" roughness={.28} metalness={.16} side={THREE.DoubleSide} /></mesh>
        <mesh position={[0,0,.012]}><torusGeometry args={[.22,.012,8,48]} /><meshStandardMaterial color="#d68a68" metalness={.5} roughness={.3} /></mesh>
        <mesh position={[0,0,.019]} rotation={[0,0,Math.PI/4]}><boxGeometry args={[.12,.12,.016]} /><meshStandardMaterial color="#D5AE62" metalness={.7} roughness={.25} /></mesh>
      </group>
    </group>
    <pointLight ref={swiatlo} position={[0,.8,.7]} color="#ffc76a" intensity={1.5} distance={6} decay={1.7} />
  </group>;
}

// Only appears during random selection; it never reserves a letter.
export function Skrytka({ otwarta }) {
  const drzwi = useRef(null);
  const obudowa = useRef(null);
  const arch = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-2.1, 0); shape.lineTo(2.1, 0); shape.lineTo(2.1, 2.25);
    shape.quadraticCurveTo(2.1, 3.25, 0, 3.25);
    shape.quadraticCurveTo(-2.1, 3.25, -2.1, 2.25); shape.closePath();
    return shape;
  }, []);
  useFrame((_, delta) => {
    const dt = Math.min(delta,.04);
    drzwi.current.rotation.x = THREE.MathUtils.damp(drzwi.current.rotation.x, otwarta ? 1.65 : 0, 3, dt);
    const skala = THREE.MathUtils.damp(obudowa.current.scale.x, otwarta ? 1 : .001, 5, dt);
    obudowa.current.scale.setScalar(skala);
  });
  return <group ref={obudowa} visible={otwarta} scale={.001} position={[0,-1.3,-.65]}>
    <mesh position={[0,0,-.15]}><extrudeGeometry args={[arch,{ depth:.12, bevelEnabled:true, bevelSize:.025, bevelThickness:.02, bevelSegments:3, steps:1 }]} /><meshStandardMaterial color="#123D32" metalness={.55} roughness={.3} /></mesh>
    {[-2.1,2.1].map(x => <mesh key={x} position={[x,1.1,.5]}><boxGeometry args={[.08,2.2,1.4]} /><meshStandardMaterial color="#123D32" metalness={.5} roughness={.3} /></mesh>)}
    <group name="drzwi-skrytki" ref={drzwi} position={[0,0,1.05]}>
      <mesh><extrudeGeometry args={[arch,{ depth:.06, bevelEnabled:true, bevelSize:.025, bevelThickness:.02, bevelSegments:3, steps:1 }]} /><meshStandardMaterial color="#123D32" metalness={.6} roughness={.28} /></mesh>
      <mesh position={[0,2.3,.1]}><boxGeometry args={[1.9,.05,.03]} /><meshStandardMaterial color="#D5AE62" metalness={.8} roughness={.2} /></mesh>
      <mesh position={[0,1.6,.13]}><torusGeometry args={[.18,.035,8,32]} /><meshStandardMaterial color="#D5AE62" metalness={.8} roughness={.2} /></mesh>
    </group>
  </group>;
}

export default function ScenaKoperty({ otwarta, aktywna, przechyl, onReady, onFailure }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const utrata = (e) => { e.preventDefault(); onFailure(); };
    canvas?.addEventListener("webglcontextlost", utrata);
    return () => canvas?.removeEventListener("webglcontextlost", utrata);
  }, [onFailure]);
  return <div className="koperta-webgl"><Canvas ref={canvasRef} frameloop={aktywna ? "always" : "never"} dpr={[1, 1.5]} camera={{ position: [0,0,7.5], fov: 35 }} gl={{ alpha: true, antialias: true, powerPreference: "default" }} fallback={null} onCreated={onReady}>
    <KinowyRig otwarta={otwarta} />
    <ambientLight intensity={1.4} color="#fff3dc" />
    <directionalLight position={[-3,4,5]} intensity={3.5} color="#ffe6b5" />
    <directionalLight position={[3,-1,2]} intensity={1} color="#829bc2" />
    <Skrytka otwarta={otwarta} /><List otwarta={otwarta} przechyl={przechyl} /><MagicznyWybuch otwarta={otwarta} /><Czasteczki />
  </Canvas></div>;
}
