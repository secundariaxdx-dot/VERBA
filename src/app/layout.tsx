import type { Metadata, Viewport } from "next";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "VERBA — Your personal path to fluency", template: "%s · VERBA" },
  description: "VERBA is a personal English coach for Cambridge C1 Advanced: adaptive lessons, Use of English, reading, listening, writing and speaking practice, and progress tracking.",
  applicationName: "VERBA",
  appleWebApp: { capable: true, title: "VERBA", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f3ebdd",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
