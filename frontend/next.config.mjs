/** @type {import('next').NextConfig} */
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

const nextConfig = {
  // Proxies /api/* to the Express backend so the browser only talks to one origin.
  // Alternatively set NEXT_PUBLIC_API_URL to call the backend directly.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }];
  },
};

export default nextConfig;
