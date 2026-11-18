/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  // Native SQLite driver must not be bundled; it is loaded from node_modules at runtime.
  serverExternalPackages: ["better-sqlite3"],
  // The SQLite file is opened via process.cwd() at runtime, so tracing cannot see it.
  // Include it explicitly so serverless deployments (e.g. Vercel) ship the database.
  outputFileTracingIncludes: {
    "/api/**/*": ["./db.sqlite3"],
  },
};

export default nextConfig;
