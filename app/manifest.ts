import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pulso",
    short_name: "Pulso",
    description: "Tu segundo cerebro para organizar, registrar y evolucionar.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbfaf6",
    theme_color: "#2B6649",
    orientation: "portrait-primary",
    icons: [
      { src: "/pulso/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/pulso/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
