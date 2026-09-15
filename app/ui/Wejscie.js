"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Jedna, wspólna animacja wejścia dla treści. Dzięki temu ruch ma ten
 * sam rytm na całej stronie i nie zamienia się w zbiór przypadkowych efektów.
 */
export default function Wejscie({ children, className = "", opoznienie = 0, as = "div" }) {
  const ograniczRuch = useReducedMotion();
  const Element = motion[as] || motion.div;

  return (
    <Element
      className={className}
      initial={ograniczRuch ? false : { opacity: 0, y: 24, filter: "blur(8px)" }}
      whileInView={ograniczRuch ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.75, delay: opoznienie, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Element>
  );
}
