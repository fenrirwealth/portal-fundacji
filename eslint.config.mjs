import coreWebVitals from "eslint-config-next/core-web-vitals";

// eslint-config-next 16 udostepnia gotowa konfiguracje plaska, wiec
// nie potrzeba warstwy zgodnosci FlatCompat — ta przy tej wersji
// wpada w cykl przy walidacji schematu.
export default [
  { ignores: ["node_modules/**", ".next/**", "scripts/**"] },
  ...coreWebVitals,
  {
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
];
