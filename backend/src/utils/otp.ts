import twilio from 'twilio';

/**
 * Generates a 6-digit numeric OTP code
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Sends a message containing the OTP to the specified phone number.
 * Integrates with Fast2SMS (highest priority) or Twilio if env vars are present, otherwise falls back to logging to console.
 */
export const sendOTP = async (phoneNumber: string, otp: string): Promise<boolean> => {
  const message = `Your CafeFlow verification OTP is ${otp}. This OTP will expire in 2 minutes.`;

  // 1. Fast2SMS Integration (Priority)
  const fast2smsKey = process.env.FAST2SMS_API_KEY;
  if (fast2smsKey) {
    try {
      console.log(`[SMS OTP] Sending via Fast2SMS to ${phoneNumber}...`);
      
      // Clean phone number: Fast2SMS expects a 10-digit number (remove +91 or 91 country code if present)
      const cleanNumber = phoneNumber.replace(/^\+91|^91/, '').replace(/\s+/g, '').trim();

      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': fast2smsKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'q',
          message: message,
          language: 'english',
          numbers: cleanNumber,
        }),
      });

      const data: any = await response.json();
      if (data && data.return === true) {
        console.log(`[SMS OTP] Fast2SMS sent successfully to ${cleanNumber}. Request ID: ${data.request_id}`);
        return true;
      } else {
        console.error('[SMS OTP] Fast2SMS API returned failure:', data?.message || data);
      }
    } catch (error) {
      console.error('[SMS OTP] Fast2SMS error:', error);
    }
  }

  // 2. Twilio Integration (Backup)
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

  // 3. Developer / Local Environment Fallback
  console.log('\n==================================================');
  console.log('                 [SMS OTP MOCK]                   ');
  console.log(`  TO:      ${phoneNumber}                         `);
  console.log(`  CODE:    ${otp}                                 `);
  console.log(`  TEXT:    ${message}                             `);
  console.log('==================================================\n');

  return true;
};

