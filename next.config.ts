import type { NextConfig } from "next";

// Nessun server: i dati vivono nel telefono (localStorage), quindi basta un sito statico.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
};

export default nextConfig;
