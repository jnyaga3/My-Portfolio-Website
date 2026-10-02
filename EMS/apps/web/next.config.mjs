/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
];
const nextConfig = {
  experimental: { typedRoutes: true },
  transpilePackages: ['@ems/db'],
  poweredByHeader: false,
  output: 'standalone',
  headers: async () => [{ source: '/(.*)', headers: securityHeaders }],
};
export default nextConfig;
