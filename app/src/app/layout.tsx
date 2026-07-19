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
  metadataBase: new URL(siteUrl),
  title: {
    default: "True North Map | Canada’s Defence and Dual-Use Ecosystem Map",
    template: "%s | True North Map"
  },
  description: siteDescription,
  robots: {
    index: true,
    follow: true
  },
  verification: {
    google: "lgHswkDeliNxwounG2mgqN4fvBF9uICrYoCfZnW1Gi0",
    other: {
      "msvalidate.01": "2763A74976C4E9AFA3E6FCB7FA1B15D1"
    }
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "True North Map Canadian Public Beta",
    description: "Find Canadian teams and technology, see where they fit, and inspect the public evidence behind every profile.",
    siteName,
    locale: "en_CA",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "True North Map Canadian Public Beta" }]
  },
  twitter: { card: "summary_large_image", title: "True North Map Canadian Public Beta", description: "Find Canadian teams and technology, see where they fit, and inspect the public evidence behind every profile.", images: ["/opengraph-image"] }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-CA" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.maptiler.com" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning className={`${barlow.variable} ${inter.variable}`}>
        <JsonLd data={[
          { "@context": "https://schema.org", "@type": "WebSite", name: siteName, url: siteUrl, description: siteDescription, inLanguage: "en-CA", potentialAction: { "@type": "SearchAction", target: `${siteUrl}/?q={search_term_string}`, "query-input": "required name=search_term_string" } },
          { "@context": "https://schema.org", "@type": "Dataset", name: "Canadian Defence and Dual-Use Ecosystem Map", description: siteDescription, url: siteUrl, creator: { "@type": "Person", name: "Andrew Davies" }, spatialCoverage: { "@type": "Country", name: "Canada" }, inLanguage: "en-CA", isAccessibleForFree: true, license: `${siteUrl}/terms`, keywords: ["Canada", "defence", "dual-use", "ecosystem", "technology", "innovation"] }
        ]} />
        {children}
        <PilotExperience />
        <PublicBetaInsights />
      </body>
    </html>
  );
}
