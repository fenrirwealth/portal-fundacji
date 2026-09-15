import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { listPubliczny } from "../../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DOMENA = process.env.NEXT_PUBLIC_PORTAL_URL || "https://portal.fundacjalepszydomlepszejutro.pl";

function skroc(tekst, limit = 175) {
  const czysty = String(tekst || "").replace(/\s+/g, " ").trim();
  if (czysty.length <= limit) return czysty;
  return `${czysty.slice(0, limit - 1).replace(/\s+\S*$/, "")}…`;
}

export async function GET(request, { params }) {
  const { id } = await params;
  const list = await listPubliczny(id);
  if (!list) return new Response("Nie znaleziono listu", { status: 404 });

  const formatOg = new URL(request.url).searchParams.get("format") === "og";
  const width = formatOg ? 1200 : 1080;
  const height = formatOg ? 630 : 1920;
  const adres = `${DOMENA}/listy/${list.id}`;
  const qr = await QRCode.toDataURL(adres, {
    width: 240,
    margin: 1,
    color: { dark: "#09152F", light: "#FFF9F0" },
    errorCorrectionLevel: "M",
  });

  const wolny = list.status === "OPUBLIKOWANY";
  const cytat = skroc(list.opis || list.marzenie);

  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", position: "relative", overflow: "hidden",
        flexDirection: "column", justifyContent: "space-between", padding: formatOg ? "62px 72px" : "118px 86px",
        color: "#FFF9F0", background: "linear-gradient(145deg, #071126 0%, #09152F 45%, #3f0b18 100%)",
        fontFamily: "serif",
      }}>
        <div style={{ position: "absolute", width: 620, height: 620, borderRadius: 999, right: -210, top: -170, background: "rgba(123,24,48,.52)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", width: 540, height: 540, borderRadius: 999, left: -280, bottom: 150, background: "rgba(18,61,50,.6)", filter: "blur(70px)" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, color: "#D5AE62", fontFamily: "sans-serif", fontSize: formatOg ? 21 : 25, letterSpacing: 4, textTransform: "uppercase" }}>
            <span style={{ width: 46, height: 2, background: "#D5AE62" }} /> Listy do Mikołaja
          </div>
          <div style={{ color: "#D5AE62", fontSize: formatOg ? 34 : 44 }}>✦</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", zIndex: 2, maxWidth: formatOg ? 800 : 900 }}>
          <div style={{ color: "#D5AE62", fontFamily: "sans-serif", fontSize: formatOg ? 24 : 30, marginBottom: 28 }}>
            {list.imie}, {list.wiek} {list.wiek === 1 ? "rok" : "lat"}
          </div>
          <div style={{ display: "flex", fontSize: formatOg ? 58 : 82, lineHeight: 1.08, letterSpacing: -2 }}>
            „{cytat}”
          </div>
          <div style={{ marginTop: 42, display: "flex", alignItems: "center", gap: 16, fontFamily: "sans-serif", fontSize: formatOg ? 22 : 28, color: wolny ? "#F3E5CB" : "#D5AE62" }}>
            <span style={{ width: 13, height: 13, borderRadius: 99, background: wolny ? "#D5AE62" : "#6EBE9B", boxShadow: "0 0 18px rgba(213,174,98,.8)" }} />
            {wolny ? "Ten list nadal czeka na swojego Mikołaja" : "Ten list ma już swojego Mikołaja"}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", zIndex: 2 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, fontFamily: "sans-serif" }}>
            <div style={{ color: "#D5AE62", fontSize: formatOg ? 25 : 31, fontWeight: 700 }}>{wolny ? "Zostań Mikołajem tego listu" : "Pomóż znaleźć Mikołaja dla kolejnego listu"}</div>
            <div style={{ color: "rgba(255,249,240,.64)", fontSize: formatOg ? 17 : 22 }}>Fundacja Lepszy Dom Lepsze Jutro</div>
          </div>
          {/* ImageResponse renderuje ten element do obrazu PNG; to nie jest obraz w dokumencie HTML. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="Kod QR prowadzący do listu" width={formatOg ? 126 : 176} height={formatOg ? 126 : 176} style={{ borderRadius: 18 }} />
        </div>
      </div>
    ),
    {
      width,
      height,
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=86400",
        "Content-Disposition": `inline; filename="list-${list.numer}-${formatOg ? "og" : "stories"}.png"`,
      },
    }
  );
}
