import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/library", destination: "/docs", permanent: false },
      { source: "/pitch", destination: "/docs/strategy/gener8tor-pitch", permanent: false },
      { source: "/playbook", destination: "/docs/strategy/room-playbook-v1", permanent: false },
      {
        source: "/thesis",
        destination: "/docs/strategy/jarvis-hud-video-thesis",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
