import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // Exclude TypeScript declaration files from webpack processing
    config.module.rules.push({
      test: /\.d\.ts$/,
      type: 'asset/resource',
      generator: {
        emit: false,
      },
    });

    // Handle esbuild and other problematic modules by excluding them
    config.module.rules.push({
      test: /node_modules\/(@remotion\/bundler|esbuild|terser-webpack-plugin)/,
      type: 'asset/resource',
      generator: {
        emit: false,
      },
    });

    // Exclude problematic files from bundling
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push({
        '@remotion/bundler': 'commonjs @remotion/bundler',
        '@remotion/renderer': 'commonjs @remotion/renderer',
        esbuild: 'commonjs esbuild',
      });
    }

    // Ignore specific problematic files
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
    };

    // Add resolve aliases to avoid problematic modules
    config.resolve.alias = {
      ...config.resolve.alias,
      esbuild: false,
    };

    return config;
  },
};

export default nextConfig;
