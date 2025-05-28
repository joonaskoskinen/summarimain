// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Konfiguraatioasetukset
  transpilePackages: ["framer-motion"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
