import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Inter autoalojada (sin CDN de Google Fonts): la misma que usa el resto de apps de Orkesta.
const inter = localFont({
  src: "./fonts/inter-latin-wght-normal.woff2",
  weight: "400 700",
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: { default: "Panel de avisos · Instalaciones Fojansa", template: "%s · Fojansa" },
  description: "Panel y CRM de avisos de Instalaciones Fojansa.",
  robots: { index: false, follow: false },
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
