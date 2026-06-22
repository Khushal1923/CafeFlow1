import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

const CRITICAL_ENV_VARS = [
  'MONGO_URI',
  'JWT_SECRET',
  'FRONTEND_URL'
];

const OPTIONAL_ENV_VARS = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

export function validateEnv(): void {
  const missingCritical: string[] = [];
  const missingOptional: string[] = [];

  for (const key of CRITICAL_ENV_VARS) {
    if (!process.env[key]) {
      missingCritical.push(key);
    }
  }

  for (const key of OPTIONAL_ENV_VARS) {
    if (!process.env[key]) {
      missingOptional.push(key);
    }
  }

  if (missingCritical.length > 0) {
    console.error('❌ CRITICAL ERROR: Missing required environment variables:');
    for (const key of missingCritical) {
      console.error(`   - ${key}`);
    }
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production' && missingOptional.length > 0) {
    console.warn('⚠️  PRODUCTION WARNING: Some optional environment variables are not set:');
    for (const key of missingOptional) {
      console.warn(`   - ${key}`);
    }
    console.warn('   Certain features (like SMS OTP or Cloudinary uploads) may fail or use fallbacks.');
  }
}
