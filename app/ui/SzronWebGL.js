"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { BezpiecznaScena } from "./Koperta3D";
function Szron() {
  const material = useRef(null);
  const uniforms = useMemo(() => ({ czas: { value: 0 } }), []);
  useFrame((_, delta) => { material.current.uniforms.czas.value += Math.min(delta, .05); });
  return <mesh><planeGeometry args={[2,2]} /><shaderMaterial ref={material} transparent uniforms={uniforms}
    vertexShader={`varying vec2 uvSzron; void main(){uvSzron=uv;gl_Position=vec4(position.xy,0.,1.);}`}
    fragmentShader={`precision mediump float; varying vec2 uvSzron; uniform float czas;
      float noise(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      void main(){vec2 p=uvSzron-.5; float grain=noise(floor(uvSzron*520.)); float edge=length(p)*1.6; float melt=czas*.45; float frost=smoothstep(melt,melt+.45,edge+grain*.18); gl_FragColor=vec4(.55,.66,.76,frost*.42);}`}
  /></mesh>;
}
export default function SzronWebGL() {
  return <div className="intro-webgl" aria-hidden="true"><BezpiecznaScena><Canvas dpr={1} gl={{ alpha:true, antialias:false }} fallback={null}><Szron /></Canvas></BezpiecznaScena></div>;
}
