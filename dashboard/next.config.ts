import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['ssh2', 'node-ssh', 'cpu-features', 'sshpk'],
};

export default nextConfig;