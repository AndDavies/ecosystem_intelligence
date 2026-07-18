import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true
  },
  outputFileTracingRoot: path.resolve(__dirname),
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "ecosystem-intelligence.vercel.app" }],
        destination: "https://truenorthmap.ca/:path*",
        permanent: true
      }
    ];
  }
};

export default nextConfig;
