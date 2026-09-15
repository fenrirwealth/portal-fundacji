export default function manifest() {
  return {
    name: "Listy do Świętego Mikołaja — Lepszy Dom Lepsze Jutro",
    short_name: "Listy do Mikołaja",
    description:
      "Wybierz zweryfikowany list dziecka i przygotuj prezent pod opieką Fundacji Lepszy Dom Lepsze Jutro.",
    start_url: "/",
    display: "standalone",
    background_color: "#09152F",
    theme_color: "#09152F",
    lang: "pl",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
