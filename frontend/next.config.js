/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // أضف هنا نطاق الـ API/CDN إذا استضفت صورًا خارجية للفعاليات أو المقالات مستقبلًا
    remotePatterns: [],
  },
};

module.exports = nextConfig;
