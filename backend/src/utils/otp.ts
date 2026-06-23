import twilio from 'twilio';

/**
 * Generates a 6-digit numeric OTP code
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Sends a message containing the OTP to the specified phone number.
 * Integrates with Meta WhatsApp Cloud API (highest priority), then Fast2SMS, Twilio, and console fallback.
 */
export const sendOTP = async (phoneNumber: string, otp: string): Promise<boolean> => {
  const message = `Your CafeFlow verification OTP is ${otp}. This OTP will expire in 2 minutes.`;

  // 1. Meta WhatsApp Cloud API Integration (Highest Priority)
  const metaToken = process.env.META_WHATSAPP_TOKEN;
  const phoneId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.META_WHATSAPP_TEMPLATE_NAME || 'verification_otp';

  if (metaToken && phoneId) {
    try {
      console.log(`[WhatsApp OTP] Sending via Meta WhatsApp API to ${phoneNumber}...`);

      // Clean phone number: Meta expects country code + number, NO '+' sign or spaces
      let cleanNumber = phoneNumber.replace(/\D/g, ''); // Remove all non-digits
      if (cleanNumber.length === 10) {
        cleanNumber = '91' + cleanNumber; // Default to India country code if 10-digit number
      }

      // Meta WhatsApp Cloud API Endpoint (v20.0)
      const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;

      // Build components dynamically (Body parameter is always required for OTP templates)
      const components: any[] = [
        {
          type: 'body',
          parameters: [
            {
              type: 'text',
              text: otp, // Variable 1: OTP Code
            },
          ],
        },
      ];

      // Add Copy Code button component if enabled in environment
      if (process.env.META_WHATSAPP_TEMPLATE_HAS_BUTTON === 'true') {
        components.push({
          type: 'button',
          sub_type: 'url',
          index: '0',
          parameters: [
            {
              type: 'text',
              text: otp, // Parameter for copy-code button
            },
          ],
        });
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${metaToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanNumber,
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: 'en_US',
            },
            components: components,
          },
        }),
      });

      const data: any = await response.json();
      if (response.ok && data.messages) {
        console.log(`[WhatsApp OTP] WhatsApp sent successfully to ${cleanNumber}. Msg ID: ${data.messages[0].id}`);
        return true;
      } else {
        console.error('[WhatsApp OTP] Meta API returned failure:', data?.error || data);
      }
    } catch (error) {
      console.error('[WhatsApp OTP] Meta API error:', error);
    }
  }

  // 2. Fast2SMS Integration (Fallback 1)
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

  // 3. Twilio Integration (Fallback 2)
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

  // 4. Developer / Local Environment Fallback
  console.log('\n==================================================');
  console.log('                 [SMS OTP MOCK]                   ');
  console.log(`  TO:      ${phoneNumber}                         `);
  console.log(`  CODE:    ${otp}                                 `);
  console.log(`  TEXT:    ${message}                             `);
  console.log('==================================================\n');

  return true;
};

