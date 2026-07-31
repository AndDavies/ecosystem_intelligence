import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  outputFileTracingRoot: path.resolve(__dirname),
  images: {
    remotePatterns: [{
      protocol: "https",
      hostname: "facoactpdckkhciamflk.supabase.co",
      pathname: "/storage/v1/object/public/brief-images/**"
    }, {
      protocol: "https",
      hostname: "facoactpdckkhciamflk.supabase.co",
      pathname: "/storage/v1/object/public/atlas-public-media/**"
    }]
  },
  experimental: {
    serverActions: { bodySizeLimit: "10mb" }
  },
  async headers() {
    const scriptSources = [
      "'self'",
      "'unsafe-inline'",
      ...(process.env.NODE_ENV === "development" ? ["'unsafe-eval'"] : []),
      "https://va.vercel-scripts.com",
      "https://www.googletagmanager.com",
      "https://challenges.cloudflare.com"
    ];
    const securityHeaders = [
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "base-uri 'self'",
          "frame-ancestors 'none'",
          "form-action 'self'",
          "object-src 'none'",
          `script-src ${scriptSources.join(" ")}`,
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https://facoactpdckkhciamflk.supabase.co https://api.maptiler.com https://*.tile.openstreetmap.org https://www.google-analytics.com",
          "font-src 'self' data:",
          "connect-src 'self' https://facoactpdckkhciamflk.supabase.co wss://facoactpdckkhciamflk.supabase.co https://api.maptiler.com https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://www.google-analytics.com https://region1.google-analytics.com https://challenges.cloudflare.com https://va.vercel-scripts.com https://vitals.vercel-insights.com https://*.vercel-insights.com",
          "frame-src https://challenges.cloudflare.com https://accounts.google.com",
          "worker-src 'self' blob:",
          "upgrade-insecure-requests"
        ].join("; ")
      }
    ];
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "ecosystem-intelligence.vercel.app" }],
        destination: "https://truenorthmap.ca/:path*",
        permanent: true
      },
      { source: "/app", destination: "/", permanent: true },
      { source: "/companies", destination: "/organizations", permanent: true },
      { source: "/shortlists", destination: "/collections", permanent: true },
      { source: "/review", destination: "/admin/review", permanent: true },
      { source: "/help", destination: "/methodology", permanent: true },
      { source: "/create-user", destination: "/sign-in", permanent: true }
    ];
  }
};

export default nextConfig;
