/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["react-nepali-datetime-picker"],

  images: {
    remotePatterns: [
      // Local dev: Django media
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/media/**",
      },

      // Optional: allow https localhost if you ever run it that way
      {
        protocol: "https",
        hostname: "localhost",
        port: "8000",
        pathname: "/media/**",
      },

      // Production backend media host (derived from NEXT_PUBLIC_API_BASE_URL)
      ...(process.env.NEXT_PUBLIC_API_BASE_URL
        ? (() => {
            try {
              const u = new URL(process.env.NEXT_PUBLIC_API_BASE_URL);
              return [
                {
                  protocol: u.protocol.replace(":", ""), // "http" | "https"
                  hostname: u.hostname,                  // no port/path
                  port: u.port || undefined,             // only if present
                  pathname: "/media/**",
                },
              ];
            } catch {
              return [];
            }
          })()
        : []),

      // Cloudinary
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
