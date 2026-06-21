import QRCode from 'qrcode';

/**
 * Generates a base64 data URL for a given string (e.g. table menu URL)
 * @param text The URL or text to encode
 * @returns Base64 image data URL
 */
export const generateQRCodeDataURL = async (text: string): Promise<string> => {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
      color: {
        dark: '#1e293b', // slate-800
        light: '#ffffff',
      },
    });
    return dataUrl;
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw err;
  }
};
