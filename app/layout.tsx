import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Wedding Invitation — Shiddiq & Pasangan",
  description: "You are invited. A personal AI assistant awaits.",
  openGraph: {
    title: "Wedding Invitation — Shiddiq & Pasangan",
    description: "You are invited. A personal AI assistant awaits.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${ibmPlexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-[#0a0a0a] text-[#f0f0f0] font-mono">{children}</body>
    </html>
  );
}
