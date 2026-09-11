import { licznik } from "../../../lib/db";
import { zwolnijWygasle } from "../rezerwacja/route";

export const dynamic = "force-dynamic";

// Licznik na zywo bez WebSocketow.
//
// Server-Sent Events wystarczaja, bo ruch jest jednokierunkowy: serwer
// nadaje, przegladarka slucha. Idzie zwyklym HTTP, przechodzi przez
// Traefika bez dodatkowej konfiguracji i nie trzeba utrzymywac stanu
// polaczen. WebSockety mialyby sens, gdyby klient tez wysylal.
//
// Przy okazji kazdego odswiezenia zwalniamy wygasle rezerwacje, wiec list,
// ktorego ktos nie potwierdzil, wraca do puli na oczach innych darczyncow.

const CO_ILE_MS = 10000;

export async function GET(request) {
  const koder = new TextEncoder();

  const strumien = new ReadableStream({
    async start(kontroler) {
      let zamkniety = false;

      const wyslij = async () => {
        if (zamkniety) return;
        try {
          await zwolnijWygasle();
          const dane = await licznik();
          kontroler.enqueue(koder.encode("data: " + JSON.stringify(dane) + "\n\n"));
        } catch {
          // Awaria bazy nie moze wywrocic strumienia — licznik po prostu
          // przestaje sie odswiezac, a strona dziala dalej.
          kontroler.enqueue(koder.encode(": blad odczytu\n\n"));
        }
      };

      await wyslij();
      const zegar = setInterval(wyslij, CO_ILE_MS);

      request.signal.addEventListener("abort", () => {
        zamkniety = true;
        clearInterval(zegar);
        try { kontroler.close(); } catch {}
      });
    },
  });

  return new Response(strumien, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Wylacza buforowanie w posrednikach, ktore inaczej przetrzymuja
      // strumien do momentu zamkniecia.
      "X-Accel-Buffering": "no",
    },
  });
}
