import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root or backend root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export function isRealKey(value) {
  if (!value || typeof value !== 'string') return false;
  const val = value.trim().toLowerCase();
  const placeholders = new Set([
    'changeme',
    'placeholder',
    'your_gemini_api_key_here',
    'your_openai_api_key_here',
    'none',
    'null',
    'test',
    'undefined'
  ]);
  if (placeholders.has(val)) return false;
  if (val.startsWith('your_') || val.startsWith('paste_') || val.startsWith('<')) return false;
  return val.length >= 12;
}

const rawAllowedOrigins = process.env.ALLOWED_ORIGINS || '';
const defaultAllowedOrigins = [
  'http://127.0.0.1:8000',
  'http://localhost:8000',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'http://localhost:5173',
  'https://adnanak8.github.io'
];

const parsedAllowedOrigins = rawAllowedOrigins
  ? rawAllowedOrigins.split(',').map(s => s.trim()).filter(Boolean)
  : defaultAllowedOrigins;

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8000', 10),
  host: process.env.HOST || '0.0.0.0',
  geminiApiKey: (process.env.GEMINI_API_KEY || '').trim(),
  geminiModel: (process.env.GEMINI_MODEL || process.env.LLM_MODEL || 'gemini-1.5-flash').trim(),
  openaiApiKey: (process.env.OPENAI_API_KEY || '').trim(),
  openaiBaseUrl: (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, ''),
  openaiModel: (process.env.OPENAI_MODEL || 'gpt-4o-mini').trim(),
  allowedOrigins: parsedAllowedOrigins,
  maxLogFileSize: 2 * 1024 * 1024, // 2MB
  isGeminiConfigured: isRealKey(process.env.GEMINI_API_KEY),
  isOpenAiConfigured: isRealKey(process.env.OPENAI_API_KEY)
};

export default config;
