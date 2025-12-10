import crypto from 'crypto';
import { config } from '../config/env.js';

const algorithm = 'aes-256-cbc';
const key = Buffer.from(config.security.encryptionKey, 'hex');
const iv = Buffer.from(config.security.encryptionIV, 'hex');

export const encrypt = (text: string): string => {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

export const decrypt = (encryptedText: string): string => {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

