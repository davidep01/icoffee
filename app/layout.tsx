import type { Metadata, Viewport } from "next";
import { RegisterSW } from "@/components/pwa/RegisterSW";
import { NoZoom } from "@/components/pwa/NoZoom";
import { AlertHost } from "@/components/ui/Alert";
import { ToastHost } from "@/components/ui/Toast";
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4ede5" },
    { media: "(prefers-color-scheme: dark)", color: "#100b08" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <div className="backdrop" aria-hidden />
        {children}
        <AlertHost />
        <ToastHost />
        <RegisterSW />
        <NoZoom />
      </body>
    </html>
  );
}
