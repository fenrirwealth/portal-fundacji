"use client";

export default function OdzyskajWidok() {
  return (
    <section role="alert" aria-labelledby="blad-widoku" style={{ maxWidth: 640, margin: "60px auto", padding: 28, borderRadius: 20, background: "#14233e", color: "#fff8e8", border: "1px solid #b69a57", fontFamily: "system-ui, sans-serif", lineHeight: 1.6 }}>
      <h1 id="blad-widoku" style={{ fontSize: 28, marginTop: 0 }}>Wróćmy do Twoich listów</h1>
      <p>Nie udało się wyświetlić strony. Odśwież widok, aby kontynuować.</p>
      <p>Jeśli błąd pojawił się przy zapisie, po odświeżeniu sprawdź stan listu przed ponowną rezerwacją.</p>
      <button type="button" onClick={() => window.location.reload()} style={{ padding: "12px 20px", borderRadius: 12, background: "#f5d38c", color: "#14233e", border: 0, fontSize: 16, cursor: "pointer" }}>Odśwież stronę</button>
      <a href="/listy" style={{ display: "inline-block", margin: "12px 20px", color: "#fff8e8" }}>Przejdź do listów</a>
    </section>
  );
}
