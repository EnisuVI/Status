/** @type {import('next').NextConfig} */
const nextConfig = {
  // On garde UNIQUEMENT l'essentiel pour les librairies SSH et Crypto
  serverExternalPackages: ['ssh2', 'crypto-js'],
};

export default nextConfig;

