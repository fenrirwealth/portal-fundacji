export class BladHttp extends Error {
  constructor(status, komunikat) {
    super(komunikat);
    this.name = "BladHttp";
    this.status = status;
  }
}

// Publiczne endpointy nie moga bez ograniczen wczytywac request.json().
// Czytamy strumien kawalkami i przerywamy natychmiast po przekroczeniu
// limitu, takze przy zadaniu bez naglowka Content-Length.
export async function jsonZLimitem(request, limitBajtow) {
  const typ = (request.headers.get("content-type") || "").split(";", 1)[0].trim().toLowerCase();
  if (typ !== "application/json") {
    throw new BladHttp(415, "Wymagany jest format JSON.");
  }

  const zadeklarowany = Number(request.headers.get("content-length"));
  if (Number.isFinite(zadeklarowany) && zadeklarowany > limitBajtow) {
    throw new BladHttp(413, "Zadanie jest zbyt duze.");
  }
  if (!request.body) throw new BladHttp(400, "Brak danych.");

  const czytnik = request.body.getReader();
  const kawalki = [];
  let rozmiar = 0;

  while (true) {
    const { done, value } = await czytnik.read();
    if (done) break;
    rozmiar += value.byteLength;
    if (rozmiar > limitBajtow) {
      await czytnik.cancel();
      throw new BladHttp(413, "Zadanie jest zbyt duze.");
    }
    kawalki.push(value);
  }

  const calosc = new Uint8Array(rozmiar);
  let przesuniecie = 0;
  for (const kawalek of kawalki) {
    calosc.set(kawalek, przesuniecie);
    przesuniecie += kawalek.byteLength;
  }

  try {
    const dane = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(calosc));
    if (!dane || typeof dane !== "object" || Array.isArray(dane)) {
      throw new Error("nie-obiekt");
    }
    return dane;
  } catch {
    throw new BladHttp(400, "Nieprawidlowe dane JSON.");
  }
}

export function odpowiedzBleduHttp(error) {
  if (!(error instanceof BladHttp)) return null;
  return Response.json({ blad: error.message }, { status: error.status });
}
