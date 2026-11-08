export const GODZINY_NA_KONTAKT = 48;
export const LIMIT_AKTYWNYCH_LISTOW = 20;
export const TELEFON_FUNDACJI = "+48 570 747 779";
export const TELEFON_HREF = "tel:+48570747779";
export const EMAIL_FUNDACJI = "kontakt@fundacjalepszydomlepszejutro.pl";
export const COOKIE_ZAPAMIETAJ = "portal-zapamietaj";
export const SESJA_KROTKA = 8 * 60 * 60;
export const SESJA_ZAPAMIETANA = 30 * 24 * 60 * 60;

export function terminKontaktu(teraz = new Date()) {
  return new Date(teraz.getTime() + GODZINY_NA_KONTAKT * 60 * 60 * 1000);
}

export function dlugoscSesji(zgoda) {
  return zgoda === true ? SESJA_ZAPAMIETANA : SESJA_KROTKA;
}

export function terminPL(data) {
  return new Date(data).toLocaleString("pl-PL", { timeZone: "Europe/Warsaw", dateStyle: "medium", timeStyle: "short" });
}
