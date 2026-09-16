import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://code.tidio.co https://*.tidio.co https://*.tidiochat.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      "font-src 'self' data: https://code.tidio.co https://*.tidio.co https://*.tidiochat.com",
      "connect-src 'self' https: wss://*.tidio.co wss://*.tidiochat.com",
      "worker-src 'self' blob: https://code.tidio.co https://*.tidio.co https://*.tidiochat.com",
      "frame-src 'self' https://www.google.com https://maps.google.com https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com https://code.tidio.co https://*.tidio.co https://*.tidiochat.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      // Idram GetPayment is a cross-origin HTML form POST from checkout/pay.
      "form-action 'self' https://banking.idram.am",
    ].join("; "),
  },
];

function buildImageRemotePatterns(): NonNullable<
  NextConfig["images"]
>["remotePatterns"] {
  // `remotePatterns` is evaluated at build time. Always allow R2 public hosts so
  // Vercel builds work even when R2_PUBLIC_BASE_URL is only set at runtime.
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    {
      protocol: "https",
      hostname: "images.pexels.com",
    },
    {
      protocol: "https",
      hostname: "img.youtube.com",
      pathname: "/vi/**",
    },
    {
      protocol: "https",
      hostname: "**.r2.dev",
      pathname: "/**",
    },
  ];

  const r2Base =
    process.env.R2_PUBLIC_BASE_URL || process.env.R2_PUBLIC_URL;
  if (r2Base) {
    try {
      const url = new URL(r2Base);
      if (url.protocol === "https:" || url.protocol === "http:") {
        patterns.push({
          protocol: url.protocol.replace(":", "") as "http" | "https",
          hostname: url.hostname,
          pathname: "/**",
        });
      }
    } catch {
      // Invalid R2 public base — wildcard *.r2.dev still covers default public URLs.
    }
  }

  return patterns;
}

/** Multipart admin uploads (images) go through middleware/proxy before Server Actions. */
const SERVER_MUTATION_BODY_SIZE_LIMIT = "50mb";

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  experimental: {
    // Next.js 16 buffers middleware/proxy bodies separately from Server Actions.
    // The default (~10MB, 1MB on some standalone hosts) drops image bytes in
    // production while `next dev` still accepts the same FormData.
    proxyClientMaxBodySize: SERVER_MUTATION_BODY_SIZE_LIMIT,
    serverActions: {
      bodySizeLimit: SERVER_MUTATION_BODY_SIZE_LIMIT,
    },
  },
  images: {
    remotePatterns: buildImageRemotePatterns(),
    qualities: [100, 75],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
