import type { Metadata } from "next";
import { Barlow, Inter } from "next/font/google";
import "./globals.css";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-barlow"
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: {
    default: "Ecosystem Intelligence Public Atlas",
    template: "%s | Ecosystem Intelligence"
  },
  description: "A public, evidence-backed atlas of Canada's defence and dual-use ecosystem."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${barlow.variable} ${inter.variable}`}>{children}</body>
    </html>
  );
}
