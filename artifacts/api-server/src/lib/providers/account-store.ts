import { encryptSecret, decryptSecret } from '../crypto';

export type StoredAccount = {
  id: string;
  provider: 'gmail' | 'microsoft' | 'imap';
  emailAddress: string;
  status: 'CONNECTED' | 'EXPIRED' | 'UNAUTHORIZED' | 'ERROR' | 'DISCONNECTED';
  tokens?: {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number; // Epoch timestamp ms
    imapConfig?: {
      host: string;
      port: number;
      secure: boolean;
      user: string;
      password?: string;
    };
  };
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
};

// Robust in-memory account store fallback for demo & local development
const memoryAccounts = new Map<string, StoredAccount>();

export async function saveAccount(account: StoredAccount): Promise<StoredAccount> {
  const accountToSave: StoredAccount = {
    ...account,
    updatedAt: new Date().toISOString(),
  };

  // Encrypt tokens payload before saving
  const encryptedPayload = encryptSecret(JSON.stringify(accountToSave.tokens || {}));
  memoryAccounts.set(account.id, {
    ...accountToSave,
    metadata: {
      ...accountToSave.metadata,
      _encryptedTokens: encryptedPayload,
    },
  });

  return accountToSave;
}

export async function getAccount(id: string): Promise<StoredAccount | null> {
  const acc = memoryAccounts.get(id);
  if (!acc) return null;
  let tokens = acc.tokens;
  if (!tokens && acc.metadata?._encryptedTokens) {
    try {
      const decrypted = decryptSecret(acc.metadata._encryptedTokens);
      tokens = JSON.parse(decrypted);
    } catch {
      tokens = undefined;
    }
  }
  return { ...acc, tokens };
}

export async function listAccounts(): Promise<Omit<StoredAccount, 'tokens'>[]> {
  return Array.from(memoryAccounts.values()).map((acc) => {
    const { tokens, ...rest } = acc;
    return rest;
  });
}

export async function deleteAccount(id: string): Promise<boolean> {
  return memoryAccounts.delete(id);
}
