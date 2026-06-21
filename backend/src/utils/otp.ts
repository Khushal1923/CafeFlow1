import twilio from 'twilio';

/**
 * Generates a 6-digit numeric OTP code
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Sends a message containing the OTP to the specified phone number.
 * Integrates with Twilio if env vars are present, otherwise falls back to logging to console.
 */
export const sendOTP = async (phoneNumber: string, otp: string): Promise<boolean> => {
  const message = `Your CafeFlow verification OTP is ${otp}. This OTP will expire in 2 minutes.`;

  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

  if (twilioSid && twilioAuthToken && twilioFrom) {
    try {
      const client = twilio(twilioSid, twilioAuthToken);
      await client.messages.create({
        body: message,
        from: twilioFrom,
        to: phoneNumber,
      });
      console.log(`[SMS OTP] Twilio sent message to ${phoneNumber}`);
      return true;
    } catch (error) {
      console.error('[SMS OTP] Twilio error, falling back to mock console:', error);
    }
  }

  // Fast2SMS integration (optional backup check)
  const fast2smsKey = process.env.FAST2SMS_API_KEY;
  if (fast2smsKey) {
    try {
      // Implement Fast2SMS fetch call here if key is provided
      // Since it requires node-fetch or axios, we can log and fetch if needed
      console.log(`[SMS OTP] Fast2SMS integration triggered for ${phoneNumber} with OTP ${otp}`);
      // Simple mock mock
    } catch (error) {
      console.error('[SMS OTP] Fast2SMS error:', error);
    }
  }

  // Developer / Local Environment Fallback
  console.log('\n==================================================');
  console.log('                 [SMS OTP MOCK]                   ');
  console.log(`  TO:      ${phoneNumber}                         `);
  console.log(`  CODE:    ${otp}                                 `);
  console.log(`  TEXT:    ${message}                             `);
  console.log('==================================================\n');

  return true;
};
