import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../../.env') });

export const env = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  databaseUrl: process.env.DATABASE_URL!,
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  webhookSecrets: {
    swiggy: process.env.SWIGGY_WEBHOOK_SECRET ?? 'swiggy-dev-secret',
    zomato: process.env.ZOMATO_WEBHOOK_SECRET ?? 'zomato-dev-secret',
  } as Record<string, string>,
  partnerCallbackUrls: {
    swiggy: process.env.SWIGGY_CALLBACK_URL ?? '',
    zomato: process.env.ZOMATO_CALLBACK_URL ?? '',
  } as Record<string, string>,
  razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ?? '',
  razorpayAccountNumber: process.env.RAZORPAY_ACCOUNT_NUMBER ?? '',
};

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL not set — copy .env.example to .env');
}
