import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mi espacio",
    short_name: "Mi espacio",
    description: "Tu organización personal y profesional, en un mismo lugar.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f6f8",
    theme_color: "#19252a",
    icons: [
      { src: "/pulso/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/pulso/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
