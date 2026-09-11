/** @type {import('next').NextConfig} */
const nextConfig = {
  // Wymagane, zeby Dockerfile mogl skopiowac .next/standalone.
  output: "standalone",
  poweredByHeader: false,
};

module.exports = nextConfig;
