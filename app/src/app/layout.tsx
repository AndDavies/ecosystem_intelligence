import type { Metadata } from "next";
import { Barlow, Inter } from "next/font/google";
import { PilotExperience } from "@/components/atlas/pilot-experience";
import { PreviewInsights } from "@/components/atlas/preview-insights";
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
  metadataBase: new URL("https://ecosystem-intelligence.vercel.app"),
  title: {
    default: "Ecosystem Intelligence Design Partner Preview",
    template: "%s | Ecosystem Intelligence"
  },
  description: "An invitation-only, evidence-backed preview of Canada's defence and dual-use ecosystem.",
  robots: {
    index: false,
    follow: false
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "Ecosystem Intelligence Design Partner Preview",
    description: "Explore verified Canadian defence and dual-use organizations, capabilities, and public evidence."
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${barlow.variable} ${inter.variable}`}>
        {children}
        <PilotExperience />
        <PreviewInsights />
      </body>
    </html>
  );
}
