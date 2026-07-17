import type { Metadata } from "next";
import { Barlow, Inter } from "next/font/google";
import { PilotExperience } from "@/components/atlas/pilot-experience";
import { PublicBetaInsights } from "@/components/atlas/public-beta-insights";
import { JsonLd } from "@/components/seo/json-ld";
import { siteDescription, siteName, siteUrl } from "@/lib/site";
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
    default: "Ecosystem Intelligence | Canadian Defence and Dual-Use Atlas",
    template: "%s | Ecosystem Intelligence"
  },
  description: "An independent, evidence-backed public atlas of Canada's defence and dual-use organizations, capabilities, and collaboration opportunities.",
  robots: {
    index: true,
    follow: true
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "Ecosystem Intelligence Canadian Public Beta",
    description: "Explore verified Canadian defence and dual-use organizations, capabilities, and public evidence.",
    siteName: "Ecosystem Intelligence",
    locale: "en_CA",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Ecosystem Intelligence Canadian Public Beta" }]
  },
  twitter: { card: "summary_large_image", title: "Ecosystem Intelligence Canadian Public Beta", description: "Explore verified Canadian defence and dual-use organizations, capabilities, and public evidence.", images: ["/opengraph-image"] }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-CA" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${barlow.variable} ${inter.variable}`}>
        <JsonLd data={[
          { "@context": "https://schema.org", "@type": "WebSite", name: siteName, url: siteUrl, description: siteDescription, inLanguage: "en-CA", potentialAction: { "@type": "SearchAction", target: `${siteUrl}/?q={search_term_string}`, "query-input": "required name=search_term_string" } },
          { "@context": "https://schema.org", "@type": "Dataset", name: "Canadian Defence and Dual-Use Ecosystem Atlas", description: siteDescription, url: siteUrl, creator: { "@type": "Person", name: "Andrew Davies" }, spatialCoverage: { "@type": "Country", name: "Canada" }, inLanguage: "en-CA", isAccessibleForFree: true, license: `${siteUrl}/terms`, keywords: ["Canada", "defence", "dual-use", "ecosystem", "capabilities", "innovation"] }
        ]} />
        {children}
        <PilotExperience />
        <PublicBetaInsights />
      </body>
    </html>
  );
}
