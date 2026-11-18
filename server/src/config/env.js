import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// List of environment variables that must be present for the server to start
const requiredVariables = [
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_SECRET',
  'FRONTEND_URL',
  'DEMO_USER_PASSWORD',
];

for (const variable of requiredVariables) {
  if (!process.env[variable] || process.env[variable].trim() === '') {
    console.error(`[CONFIG ERROR] Missing required environment variable: ${variable}`);
    process.exit(1);
  }
}

// JWT secret must be at least 32 characters to ensure sufficient entropy for HMAC SHA-256
if (process.env.JWT_SECRET.length < 32) {
  console.error('[CONFIG ERROR] JWT_SECRET must be at least 32 characters long');
  process.exit(1);
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 3000,
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS, 10) || 10,
  FRONTEND_URL: process.env.FRONTEND_URL,
  DEMO_USER_PASSWORD: process.env.DEMO_USER_PASSWORD,
};
