"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

// Jeden toast na raz. Kolejkowanie kilku komunikatow naraz na telefonie
// zaslania tresc, a uzytkownik i tak przeczyta tylko ostatni.
/** @type {import("react").Context<(tresc: string, rodzaj?: "info"|"blad") => void>} */
const Kontekst = createContext(() => {});

export function useToast() {
  return useContext(Kontekst);
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const pokaz = useCallback((tresc, rodzaj = "info") => {
    setToast({ tresc, rodzaj, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <Kontekst.Provider value={pokaz}>
      {children}
      {/* role=status, nie alert: komunikaty sa informacyjne i nie
          powinny przerywac czytania czytnikowi ekranu w polowie zdania */}
      <div className="toast-obszar" role="status" aria-live="polite">
        {toast && (
          <div className={"toast" + (toast.rodzaj === "blad" ? " toast-blad" : "")} key={toast.id}>
            <span>{toast.tresc}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Zamknij komunikat"
              style={{ background: "none", border: 0, color: "inherit", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 4 }}
            >
              ×
            </button>
          </div>
        )}
      </div>
    </Kontekst.Provider>
  );
}
