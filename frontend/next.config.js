/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // firebase-admin (وتبعيته jose) حزمة ESM خالصة — لو Next.js حاول يجمّعها
  // (bundle) بـ webpack زي باقي الكود بيطلع ERR_REQUIRE_ESM وقت التشغيل على
  // Vercel. استثناءها هنا بيخلي Next.js يسيبها تتحمّل عن طريق Node.js نفسه
  // وقت التشغيل بدل ما يحاول يجمّعها.
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin'],
  },
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
