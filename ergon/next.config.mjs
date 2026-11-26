/** @type {import('next').NextConfig} */
const nextConfig = {
  // Το Docker image χτίζεται ως standalone· τοπικά αρκεί το `npm start`.
  output: process.env.BUILD_STANDALONE ? "standalone" : undefined,
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3"],
    serverActions: { bodySizeLimit: "60mb" },
  },
};
export default nextConfig;
