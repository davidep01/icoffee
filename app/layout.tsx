import type { Metadata, Viewport } from "next";
import { RegisterSW } from "@/components/pwa/RegisterSW";
import { NoZoom } from "@/components/pwa/NoZoom";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "iPagato", template: "%s · iPagato" },
  description: "Chi offre il caffè oggi? Una ruota pesata che distribuisce i pagamenti in modo equo.",
  applicationName: "iPagato",
  appleWebApp: { capable: true, title: "iPagato", statusBarStyle: "default" },
  icons: { icon: "/icon.svg", apple: "/icons/apple.png" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#f6efe7",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <div className="backdrop" aria-hidden />
        {children}
        <RegisterSW />
        <NoZoom />
      </body>
    </html>
  );
}
