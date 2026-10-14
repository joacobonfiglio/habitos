import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./modern.css";
import "./module-actions.css";
import "./calm-theme.css";
import { PwaRegister } from "./pwa-register";
import { LifeOSNavigationV2 } from "./lifeos-navigation-v2";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pulso",
  description: "Tu espacio para organizar tu día, construir hábitos y descubrir patrones.",
  manifest: "/manifest.webmanifest",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/pulso/icon.svg",
    shortcut: "/pulso/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PwaRegister />
        <LifeOSNavigationV2 />
        {children}
      </body>
    </html>
  );
}
