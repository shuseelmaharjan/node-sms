/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  transpilePackages: ['react-nepali-datetime-picker'],

  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      ...(process.env.NEXT_PUBLIC_API_BASE_URL
        ? (() => {
            try {
              const u = new URL(process.env.NEXT_PUBLIC_API_BASE_URL);
              return [
                {
                  protocol: u.protocol.replace(':', ''),
                  hostname: u.hostname,
                  port: u.port || undefined,
                  pathname: '/media/**',
                },
              ];
            } catch {
              return [];
            }
          })()
        : []),
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;