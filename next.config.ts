import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export so the app can be bundled into a native (Capacitor) iOS shell.
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
