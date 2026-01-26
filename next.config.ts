/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["react-nepali-datetime-picker"],
  images: {
    remotePatterns: [
      // Development
      ...(process.env.NODE_ENV === 'development' ? [
        {
          protocol: 'http' as const,
          hostname: 'localhost',
          port: '8000',
          pathname: '/media/**',
        },
        {
          protocol: 'https' as const,
          hostname: 'localhost',
          port: '8000',
          pathname: '/media/**',
        },
      ] : []),
      // Production
      ...(process.env.NODE_ENV === 'production' ? [
        {
          protocol: 'https' as const,
          hostname: process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/^https?:\/\//, '') || '',
          pathname: '/media/**',
        },
      ] : []),
      // Common services
      {
        protocol: 'https' as const,
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

module.exports = nextConfig;