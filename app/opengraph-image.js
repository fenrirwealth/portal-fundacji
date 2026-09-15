import { ImageResponse } from "next/og";

export const alt = "Każdy list czeka na swojego Mikołaja — Fundacja Lepszy Dom Lepsze Jutro";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(145deg, #050B1A 0%, #09152F 54%, #14264A 100%)",
          color: "#FFF9F0",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 520,
            height: 520,
            right: -90,
            top: -70,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(123,24,48,.78), rgba(123,24,48,0) 68%)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: 760,
            padding: "70px 0 70px 82px",
          }}
        >
          <div style={{ color: "#D5AE62", fontSize: 22, letterSpacing: 5, textTransform: "uppercase" }}>
            Fundacja Lepszy Dom Lepsze Jutro
          </div>
          <div style={{ fontSize: 74, lineHeight: 1.02, marginTop: 32, letterSpacing: -2 }}>
            Każdy list czeka na swojego Mikołaja.
          </div>
          <div style={{ fontFamily: "Arial, sans-serif", fontSize: 26, color: "#DFCDAE", marginTop: 28 }}>
            Wybierz marzenie. Podaruj dziecku magiczne święta.
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            right: 90,
            top: 174,
            width: 270,
            height: 184,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 10,
            transform: "rotate(5deg)",
            background: "linear-gradient(145deg, #FFF9F0, #F3E5CB)",
            border: "3px solid #D5AE62",
            boxShadow: "0 28px 60px rgba(0,0,0,.38)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              clipPath: "polygon(0 0, 100% 0, 50% 63%)",
              background: "#DFCDAE",
              borderRadius: 8,
            }}
          />
          <div
            style={{
              width: 58,
              height: 58,
              marginTop: 38,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              background: "#7B1830",
              border: "3px solid #D5AE62",
              color: "#FFF9F0",
              fontSize: 30,
            }}
          >
            LD
          </div>
        </div>
      </div>
    ),
    size
  );
}
