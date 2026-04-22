/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ["@solana/wallet-adapter-react-ui"],
};

export default nextConfig;
