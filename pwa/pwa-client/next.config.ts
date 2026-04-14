import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https?.*\/(para-llevar|en-restaurante|ordenes|contacto)/,
      handler: "NetworkFirst",
      options: { cacheName: "foodify-pages", expiration: { maxEntries: 10, maxAgeSeconds: 86400 } },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
      handler: "CacheFirst",
      options: { cacheName: "foodify-images", expiration: { maxEntries: 60, maxAgeSeconds: 604800 } },
    },
    {
      urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
      handler: "CacheFirst",
      options: { cacheName: "foodify-fonts", expiration: { maxEntries: 20, maxAgeSeconds: 31536000 } },
    },
    {
      urlPattern: /\/_next\/static\/.*/,
      handler: "CacheFirst",
      options: { cacheName: "foodify-static", expiration: { maxEntries: 100, maxAgeSeconds: 2592000 } },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://3.142.73.52:3000";
    return [
      {
        source: "/api_proxy/socket.io/:path*",
        destination: `${backendUrl}/socket.io/:path*`,
      },
      {
        source: "/api_proxy/:path*",
        destination: backendUrl + "/:path*",
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/admin/login",
        destination: "/login",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  webpack: (config: any) => {
    return config;
  },
};

export default withPWA(nextConfig);

