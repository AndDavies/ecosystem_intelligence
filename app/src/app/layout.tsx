import type { Metadata } from "next";
import { Barlow, Inter } from "next/font/google";
import { PublicBetaExperience } from "@/components/atlas/public-beta-experience";
import { PublicBetaInsights } from "@/components/atlas/public-beta-insights";
import { SkipLink } from "@/components/atlas/skip-link";
import { JsonLd } from "@/components/seo/json-ld";
import { brandCopy } from "@/lib/brand-copy";
import { officialSocialLinks, siteDescription, siteName, siteUrl } from "@/lib/site";
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
    default: "True North Map | Canadian Defence Capability Discovery",
    template: `%s | ${siteName}`
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
    title: `True North Map | ${brandCopy.promise}`,
    description: brandCopy.positioning,
    siteName,
    locale: "en_CA",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "True North Map: Canada is building more than most people can see" }]
  },
  twitter: { card: "summary_large_image", title: `True North Map | ${brandCopy.promise}`, description: `${brandCopy.positioning} ${brandCopy.journey}`, images: ["/opengraph-image"] }
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
        <SkipLink />
        <JsonLd data={[
          { "@context": "https://schema.org", "@type": "WebSite", name: siteName, url: siteUrl, description: siteDescription, inLanguage: "en-CA", potentialAction: { "@type": "SearchAction", target: `${siteUrl}/map?q={search_term_string}`, "query-input": "required name=search_term_string" } },
          { "@context": "https://schema.org", "@type": "Organization", name: siteName, url: siteUrl, sameAs: [officialSocialLinks.linkedIn, officialSocialLinks.x] },
          { "@context": "https://schema.org", "@type": "Dataset", name: "Canadian Defence and Dual-Use Ecosystem Map", description: siteDescription, url: siteUrl, creator: { "@type": "Person", name: "Andrew Davies" }, spatialCoverage: { "@type": "Country", name: "Canada" }, inLanguage: "en-CA", isAccessibleForFree: true, license: `${siteUrl}/terms`, keywords: ["Canada", "defence", "dual-use", "ecosystem", "technology", "innovation"] }
        ]} />
        <div id="main-content" tabIndex={-1} className="outline-none">
          {children}
        </div>
        <PublicBetaExperience />
        <PublicBetaInsights />
      </body>
    </html>
  );
}
