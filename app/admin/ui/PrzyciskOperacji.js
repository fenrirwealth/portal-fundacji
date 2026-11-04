"use client";
import { useFormStatus } from "react-dom";

export default function PrzyciskOperacji({ children, className = "btn" }) {
  const { pending } = useFormStatus();
  return <button className={className} type="submit" disabled={pending} aria-busy={pending}>{pending ? "Zapisuję…" : children}</button>;
}
