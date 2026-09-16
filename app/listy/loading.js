import { SzkieletListy } from "../ui/Szkielet";

// Szkielet dla calej trasy /listy — pokazuje sie natychmiast przy
// nawigacji, zanim serwer zdazy policzyc zapytania do bazy.
export default function Ladowanie() {
  return (
    <div className="listy-premium listy-loading">
      <div className="listy-swiatlo" aria-hidden="true" />
      <div className="listy-premium-wrap">
        <div className="szkielet" style={{ width: "38%", height: "2.6rem", marginBottom: "var(--o-4)" }} />
        <div className="szkielet szkielet-tekst" style={{ width: "70%" }} />
        <div className="szkielet szkielet-tekst" style={{ width: "55%", marginBottom: "var(--o-6)" }} />
        <div className="szkielet" style={{ height: 96, borderRadius: "var(--r-lg)", marginBottom: "var(--o-6)" }} />
        <SzkieletListy />
      </div>
    </div>
  );
}
