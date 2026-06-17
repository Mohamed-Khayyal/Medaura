/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Accept-CH",
            value: "Sec-CH-UA-Model, Sec-CH-UA-Platform, Sec-CH-UA-Platform-Version, Sec-CH-UA-Mobile, Sec-CH-UA",
          },
          {
            key: "Critical-CH",
            value: "Sec-CH-UA-Model, Sec-CH-UA-Platform, Sec-CH-UA-Platform-Version",
          },
          {
            key: "Permissions-Policy",
            value: "ch-ua-model=(*), ch-ua-platform=(*), ch-ua-platform-version=(*), ch-ua-mobile=(*)",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;