import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // lets the dev server be reached through a tunnel (localtunnel/ngrok/etc)
  // for on-phone testing — has no effect on production builds
  allowedDevOrigins: [
    "*.loca.lt",
    "*.ngrok-free.app",
    "*.ngrok.io",
    "*.trycloudflare.com",
    "192.168.11.106",
  ],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
