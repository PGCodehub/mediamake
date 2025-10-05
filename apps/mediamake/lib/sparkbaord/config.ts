const SPARKBOARD_BASE_URL =
  'https://506abypwqe.execute-api.us-east-1.amazonaws.com/prod';
const AI_ANALYSIS_BASE_URL =
  'https://506abypwqe.execute-api.us-east-1.amazonaws.com/prod';

export const SPARKBOARD_CONFIG = {
  baseUrl: SPARKBOARD_BASE_URL,
};

export const AI_ANALYSIS_CONFIG = {
  baseUrl: AI_ANALYSIS_BASE_URL,
  apiKey: process.env.SPARKBOARD_API_KEY,
};
