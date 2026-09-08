/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // أضف هنا نطاق الـ API/CDN إذا استضفت صورًا خارجية للفعاليات أو المقالات مستقبلًا
    remotePatterns: [],
  },
  // ترويسات أمان أساسية على كل الردود — Next.js لا يضيفها افتراضيًا
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
