/** @type {import('next').NextConfig} */
const nextConfig = {
  // On force l'exclusion des modules serveurs du bundle client/edge
  serverExternalPackages: ['ssh2', 'crypto-js'],
  
  // Si tu as un souci de build persistant, on désactive Turbopack globalement ici
  experimental: {
    turbo: {
      // On peut laisser vide ou configurer des règles, 
      // mais "serverExternalPackages" au-dessus est la clé.
    }
  }
};

export default nextConfig;