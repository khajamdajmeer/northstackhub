import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        // The page moved when published prices came off the site. Permanent, so
        // indexed results and any inbound link land on the replacement rather
        // than a 404.
        source: "/pricing",
        destination: "/packages",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
