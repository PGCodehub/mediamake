import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  skipNodeModulesBundle: true,
  external: ['@remotion/google-fonts'],
  // Use esbuild instead of rollup to avoid native binary issues
  esbuildOptions: (options) => {
    options.platform = 'node';
  },
  // Disable rollup optimizations that require native binaries
  minify: false,
  treeshake: false,
});
