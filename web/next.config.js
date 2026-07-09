/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produces .next/standalone (a minimal Node server) for the Docker image.
  output: "standalone",
  // Hackathon MVP: never fail the Docker build on a stray type/lint issue.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

module.exports = nextConfig;
