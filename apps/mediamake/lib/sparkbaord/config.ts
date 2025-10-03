const SPARKBOARD_BASE_URL = 'http://localhost:3000/dev';
const AI_ANALYSIS_BASE_URL = 'http://localhost:4000/dev';

export const SPARKBOARD_CONFIG = {
  baseUrl: SPARKBOARD_BASE_URL,
};

export const AI_ANALYSIS_CONFIG = {
  baseUrl: AI_ANALYSIS_BASE_URL,
  apiKey: process.env.SPARKBOARD_API_KEY,
};
