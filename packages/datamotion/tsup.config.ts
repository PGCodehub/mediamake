import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  // Force esbuild only, completely disable rollup
  esbuildOptions: (options) => {
    options.platform = 'node';
    options.target = 'node18';
  },
  // Disable all rollup features
  minify: false,
  treeshake: false,
  splitting: false,
  // Use esbuild for everything
  bundle: true,
  // Disable rollup completely
  noExternal: [],
});
