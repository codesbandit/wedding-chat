import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Undangan Pernikahan — Rhesi & Shiddiq",
  description: "Dengan penuh syukur, kami mengundang kamu ke hari bahagia kami.",
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "Undangan Pernikahan — Rhesi & Shiddiq",
    description: "Dengan penuh syukur, kami mengundang kamu ke hari bahagia kami.",
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
      <body className="min-h-full bg-[#fdfcfc] text-[#201d1d] font-mono">{children}</body>
    </html>
  );
}
