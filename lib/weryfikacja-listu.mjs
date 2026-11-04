// Zgody szczegolowe sa niezalezne od stwierdzenia braku danych w skanie.
export const POLA_WERYFIKACJI = [
  "zgodaDolaczona", "brakNazwiska", "brakPlacowki", "brakMiejscowosci",
  "brakInnychOsob", "brakDanychWrazliwych", "brakWizerunku",
  "metadaneUsuniete", "nazwaPlikuPoprawna", "opisPoprawny",
];
export const ZGODY_SZCZEGOLOWE = {
  brakNazwiska: "zgodaNaNazwisko",
  brakDanychWrazliwych: "zgodaNaDaneZdrowotne",
};
export function pozycjaSpelniona(w, pole) {
  return w[pole] === true || (ZGODY_SZCZEGOLOWE[pole] && w[ZGODY_SZCZEGOLOWE[pole]] === true);
}
export function brakujacePozycje(w) {
  return POLA_WERYFIKACJI.filter(pole => !pozycjaSpelniona(w, pole));
}
