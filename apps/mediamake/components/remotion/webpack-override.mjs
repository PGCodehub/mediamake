import { enableTailwind } from '@remotion/tailwind-v4';

/**
 *  @param {import('webpack').Configuration} currentConfig
 */
export const webpackOverride = currentConfig => {
  const config = enableTailwind(currentConfig);
  // Suppress all warnings
  // Alternative: suppress specific warnings
  config.ignoreWarnings = [
    ...(config.ignoreWarnings || []),
    /Module not found.*@remotion\/google-fonts/,
    /Can't resolve '@remotion\/google-fonts'/,
  ];
  return config;
};
