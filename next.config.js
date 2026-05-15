/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  experimental: {
    serverComponentsExternalPackages: ['mongoose'],
  },
  async rewrites() {
    return [
      {
        source: '/api/socket_io/:path*',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}/api/socket_io/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
