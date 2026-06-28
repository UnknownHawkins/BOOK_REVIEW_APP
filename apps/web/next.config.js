/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.clerk.accounts.dev https://clerk.accounts.dev https://*.clerk.com; connect-src 'self' http://localhost:5000 ws://localhost:3000 ws://localhost:5000 https://*.onrender.com https://*.clerk.accounts.dev https://clerk.accounts.dev https://*.clerk.com https://discordapp.com https://sacred-beagle-153277.upstash.io wss://*.clerk.accounts.dev; img-src 'self' data: blob: https://img.clerk.com https://images.unsplash.com https://*.clerk.accounts.dev; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; frame-src 'self' https://*.clerk.accounts.dev https://clerk.accounts.dev https://*.clerk.com; object-src 'none'; base-uri 'self'; form-action 'self' https://*.clerk.accounts.dev https://clerk.accounts.dev https://*.clerk.com;",
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-site',
          }
        ],
      },
    ];
  },
};

module.exports = nextConfig;
