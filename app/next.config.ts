import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  images: {
    remotePatterns: [{
      protocol: "https",
      hostname: "facoactpdckkhciamflk.supabase.co",
      pathname: "/storage/v1/object/public/brief-images/**"
    }]
  },
  experimental: {
    serverActions: { bodySizeLimit: "10mb" }
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
