const ADRES = "https://portal.fundacjalepszydomlepszejutro.pl";

const STRONY = [
  ["", "weekly", 1],
  ["/listy", "daily", 0.9],
  ["/o-akcji", "monthly", 0.8],
  ["/regulamin", "yearly", 0.4],
  ["/zglos-placowke", "monthly", 0.6],
  ["/fundusz-ostatniej-gwiazdki", "monthly", 0.8],
];

export default function sitemap() {
  return STRONY.map(([sciezka, changeFrequency, priority]) => ({
    url: `${ADRES}${sciezka}`,
    changeFrequency,
    priority,
  }));
}
