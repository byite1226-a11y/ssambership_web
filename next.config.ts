import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      /** 맞춤의뢰 납품 파일(최대 20MB) — Server Action FormData */
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
