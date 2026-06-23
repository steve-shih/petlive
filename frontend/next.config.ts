import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['webrtc-tree'],
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
        source: '/peer-api/:path*',
        destination: 'http://127.0.0.1:3000/peer-api/:path*',
      }
    ]
  },
  allowedDevOrigins: ['192.168.0.86', 'pepa.ngrok.app', '49.158.138.26', 'localhost']
};

export default nextConfig;
