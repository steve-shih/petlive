import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "http",
        hostname: "commondatastorage.googleapis.com",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:5000/api/:path*',
      },
      {
        source: '/myapp/:path*',
        destination: 'http://127.0.0.1:9000/myapp/:path*',
      },
    ]
  },
  allowedDevOrigins: ['192.168.0.86', 'pepa.ngrok.app', '49.158.138.26', 'localhost']
};

export default nextConfig;
