const ADRES = "https://portal.fundacjalepszydomlepszejutro.pl";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/listy", "/o-akcji", "/regulamin", "/zglos-placowke", "/fundusz-ostatniej-gwiazdki"],
      disallow: [
        "/admin/",
        "/api/",
        "/moje-rezerwacje",
        "/zaloguj",
        "/listy/losowy",
        "/listy/*",
        "/placowka/",
      ],
    },
    sitemap: `${ADRES}/sitemap.xml`,
    host: ADRES,
  };
}
