"use server";

import { signOut } from "../auth";

// Wylogowanie jako NAZWANA akcja w osobnym module.
//
// Wczesniej bylo to anonimowe wyrazenie wpisane wprost w uklad strony.
// Taka akcja, renderowana na kazdej podstronie, przechwytywala wysylke
// innych formularzy: klikniecie "Utworz szkic" w panelu konczylo sie
// wylogowaniem. Nazwana akcja w module ma stabilny identyfikator
// i nie koliduje z formularzami widokow.
export async function wyloguj() {
  await signOut({ redirectTo: "/" });
}
