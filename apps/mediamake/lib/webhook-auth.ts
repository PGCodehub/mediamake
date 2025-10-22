import jwt from 'jsonwebtoken';

/**
 * Encrypt API key using JWT for webhook authentication
 * Similar to SparkBoard's webhook pattern
 */
export function encryptWebhookSecret(apiKey: string): string | null {
  try {
    const secret = process.env.MEDIA_HELPER_SECRET;
    if (!secret) {
      console.error('MEDIA_HELPER_SECRET not configured');
      return null;
    }
    
    const encrypted = jwt.sign({ apiKey }, secret, { expiresIn: '7d' });
    return encrypted;
  } catch (error) {
    console.error('Error encrypting webhook secret:', error);
    return null;
  }
}

/**
 * Decrypt JWT token to get API key
 */
export function decryptWebhookSecret(token: string): string | null {
  try {
    const secret = process.env.MEDIA_HELPER_SECRET;
    if (!secret) {
      console.error('MEDIA_HELPER_SECRET not configured');
      return null;
    }
    
    const decoded = jwt.verify(token, secret);
    
    if (typeof decoded === 'string') {
      return decoded;
    }
    
    if (typeof decoded === 'object' && 'apiKey' in decoded) {
      return decoded.apiKey as string;
    }
    
    return null;
  } catch (error) {
    console.error('Error decrypting webhook secret:', error);
    return null;
  }
}

/**
 * Send webhook with encrypted authentication
 */
export async function sendWebhook(
  url: string,
  encryptedSecret: string,
  body: any
): Promise<any> {
  try {
    const apiKey = decryptWebhookSecret(encryptedSecret);
    
    if (!apiKey) {
      throw new Error('Failed to decrypt webhook secret');
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Webhook failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }
    
    return response.json();
  } catch (error) {
    console.error('Error sending webhook:', error);
    throw error;
  }
}

