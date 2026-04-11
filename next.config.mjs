/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent webpack from bundling pdf-parse (uses Node.js fs/Buffer internals).
  // It will be required natively at runtime inside the Node.js API routes.
  serverExternalPackages: ['pdf-parse'],
}

export default nextConfig
