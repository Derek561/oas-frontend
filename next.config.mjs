import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias["@"] = path.resolve("src");
    console.log("✅ Aliases configured:", config.resolve.alias["@"]);
    return config;
  },
};

export default nextConfig;
