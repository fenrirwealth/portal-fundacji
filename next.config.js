const fs = require("node:fs");
const path = require("node:path");

// Jeden identyfikator dla całego obrazu i wszystkich workerów. Next.js
// rozpozna starszą kartę po wdrożeniu i przeładuje spójny zestaw plików.
let wersjaWdrozenia = process.env.NEXT_DEPLOYMENT_ID;
if (!wersjaWdrozenia) {
  try { wersjaWdrozenia = fs.readFileSync(path.join(__dirname, ".wersja-wdrozenia"), "utf8").trim(); }
  catch { /* Lokalny tryb developerski nie wymaga identyfikatora obrazu. */ }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  deploymentId: wersjaWdrozenia || undefined,
  // Wymagane, zeby Dockerfile mogl skopiowac .next/standalone.
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
