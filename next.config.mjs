/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  images: {
    qualities: [75, 80, 95, 100],
  },
  // A no-repo deploy (e.g. Vercel file upload without public/ binaries) sets
  // ASSETS_REWRITE_BASE to a CDN mirror of the repo's public directory.
  async rewrites() {
    const base = process.env.ASSETS_REWRITE_BASE;
    if (!base) return [];
    return [
      { source: "/assets/:path*", destination: `${base}/assets/:path*` },
      { source: "/favicons/:path*", destination: `${base}/favicons/:path*` },
    ];
  },
};

export default nextConfig;
