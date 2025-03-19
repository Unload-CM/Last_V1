/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    serverActions: true
  },
  webpack: (config) => {
    config.externals = [...config.externals, { canvas: "canvas" }];  // required
    return config;
  },
};

module.exports = nextConfig; 