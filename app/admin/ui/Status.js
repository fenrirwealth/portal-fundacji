// Plakietka statusu listu. Jedno zrodlo prawdy dla etykiet i kolorow —
// wczesniej etykiety byly powielone w dwoch widokach, a kolorow nie bylo
// wcale, wiec przy stu wierszach nie dalo sie ogarnac tabeli wzrokiem.

export const ETYKIETY = {
  SZKIC: "Szkic",
  DO_POPRAWY: "Do poprawy",
  OPUBLIKOWANY: "Opublikowany",
  ZAREZERWOWANY: "Zarezerwowany",
  OPLACONY: "Prezent przyjęty",
  PRZEKAZANY: "Przekazany",
  WYCOFANY: "Wycofany",
};

const KLASY = {
  SZKIC: "plakietka-zajety",
  DO_POPRAWY: "plakietka-gotowy",
  OPUBLIKOWANY: "plakietka-wolny",
  ZAREZERWOWANY: "plakietka-gotowy",
  OPLACONY: "plakietka-gotowy",
  PRZEKAZANY: "plakietka-wolny",
  WYCOFANY: "plakietka-zajety",
};

/** @param {{status: string}} p */
export default function Status({ status }) {
  return (
    <span className={"plakietka " + (KLASY[status] || "plakietka-zajety")}>
      {ETYKIETY[status] || status}
    </span>
  );
}
