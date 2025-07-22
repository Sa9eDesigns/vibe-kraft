import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable cross-origin isolation for WebVM routes only
  async headers() {
    return [
      {
        // Apply cross-origin isolation to WebVM and AI workspace routes
        source: '/(workspace|ai-workspace)/:path*',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin'
          }
        ]
      },
      {
        // Apply to CheerpX static assets
        source: '/cheerpx/:path*',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp'
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin'
          }
        ]
      }
    ];
  },

  // API rewrites for infrastructure services
  async rewrites() {
    const rewrites = [];

    // MinIO Storage API rewrites
    if (process.env.MINIO_ENDPOINT) {
      rewrites.push({
        source: '/api/storage/:path*',
        destination: `${process.env.MINIO_ENDPOINT}/:path*`
      });
    }

    // Prometheus Metrics API rewrites
    if (process.env.PROMETHEUS_URL) {
      rewrites.push({
        source: '/api/metrics/:path*',
        destination: `${process.env.PROMETHEUS_URL}/api/v1/:path*`
      });
    }

    // Firecracker API rewrites
    if (process.env.FIRECRACKER_API_URL) {
      rewrites.push({
        source: '/api/firecracker/:path*',
        destination: `${process.env.FIRECRACKER_API_URL}/:path*`
      });
    }

    // Docker API rewrites
    if (process.env.DOCKER_API_URL) {
      rewrites.push({
        source: '/api/docker/:path*',
        destination: `${process.env.DOCKER_API_URL}/:path*`
      });
    }

    return rewrites;
  },

  // Environment-specific redirects
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/dashboard/infrastructure',
        permanent: false,
      },
      {
        source: '/monitoring',
        destination: '/dashboard/metrics',
        permanent: false,
      }
    ];
  },

  // External packages for server components
  serverExternalPackages: ['@prisma/client', '@leaningtech/cheerpx'],

  // Output configuration for standalone deployment
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

  // Webpack configuration for WebAssembly
  webpack: (config, { isServer }) => {
    // Add WebAssembly support
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      syncWebAssembly: true,
    };

    // Handle .wasm files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    // Don't parse WebAssembly files on the server
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'sharp': 'commonjs sharp',
      });
    }

    return config;
  },

  devIndicators: false,

  // Image optimization for production
  images: {
    domains: process.env.MINIO_ENDPOINT ? [new URL(process.env.MINIO_ENDPOINT).hostname] : [],
    unoptimized: process.env.NODE_ENV === 'development',
  },
};

export default nextConfig;
