import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Owner logos are served either from Supabase Storage or, in local dev,
    // from /public/uploads. Everything else stays blocked.
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
};

export default nextConfig;
