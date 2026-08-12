import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET || 'security-guard-default-server-encryption-secret-32b';
  return crypto.createHash('sha256').update(secret).digest();
}

export function encryptSecret(plainText: string): string {
  if (!plainText) return '';
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
}

export function decryptSecret(cipherText: string): string {
  if (!cipherText) return '';
  try {
    const parts = cipherText.split(':');
    if (parts.length !== 3) return cipherText; // Fallback if plain
    const [ivHex, tagHex, encryptedHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    return '';
  }
}
