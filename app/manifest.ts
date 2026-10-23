import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "iPagato",
    short_name: "iPagato",
    description: "Chi offre il caffè oggi? Lo decide la ruota, con giustizia.",
    lang: "it",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6efe7",
    theme_color: "#f6efe7",
    categories: ["food", "lifestyle", "utilities"],
    icons: [
      { src: "/icons/192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
