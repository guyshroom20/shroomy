import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Yoti SDK reads its key and protobuf files at runtime, so it runs from node_modules unbundled.
  serverExternalPackages: ["yoti"],
};

export default nextConfig;
