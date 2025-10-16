import jwt from 'jsonwebtoken';

export function encrypt(text: string, key: string) {
  try {
    const encoded = jwt.sign({ text }, key, {
      expiresIn: '2d',
    });
    return encoded;
  } catch (error) {
    console.error('Error encrypting text:', error);
    return null;
  }
}
