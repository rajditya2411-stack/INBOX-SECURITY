import type { EmailProvider, ProviderStatus, ListMessagesOptions, EmailFolder, CreateMessagePayload } from './types';
import type { NormalizedEmail } from '../security-engine';

export class RealApiEmailProvider implements EmailProvider {
  readonly id: string;
  readonly name: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  async getStatus(): Promise<ProviderStatus> {
    try {
      const res = await fetch('/api/accounts');
      if (!res.ok) return 'NOT_CONFIGURED';
      const data = await res.json();
      const accounts: Array<any> = data.accounts || [];
      const match = accounts.find((a) => a.provider === this.id);
      if (!match) return 'NOT_CONFIGURED';
      return (match.status as ProviderStatus) || 'CONNECTED';
    } catch {
      return 'NOT_CONFIGURED';
    }
  }

  async listMessages(options?: ListMessagesOptions): Promise<NormalizedEmail[]> {
    const folderId = options?.folderId || 'inbox';
    const limit = options?.limit || 20;

    const res = await fetch(`/api/messages?provider=${this.id}&folderId=${encodeURIComponent(folderId)}&limit=${limit}`);
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(`Provider "${this.name}" is not connected. Please connect your account in Settings.`);
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to fetch messages for ${this.name}`);
    }

    const data = await res.json();
    return data.messages || [];
  }

  async getMessage(id: string): Promise<NormalizedEmail | null> {
    const messages = await this.listMessages({ limit: 50 });
    return messages.find((m) => m.id === id) || null;
  }

  async listFolders(): Promise<EmailFolder[]> {
    const res = await fetch(`/api/folders?provider=${this.id}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.folders || [];
  }

  async sendMessage(payload: CreateMessagePayload): Promise<NormalizedEmail> {
    const res = await fetch('/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: this.id, ...payload }),
    });
    if (!res.ok) {
      throw new Error(`Sending message not supported or failed for ${this.name}`);
    }
    const data = await res.json();
    return data.message;
  }
}

export const GmailProviderStub = new RealApiEmailProvider('gmail', 'Gmail');
export const MicrosoftProviderStub = new RealApiEmailProvider('microsoft', 'Microsoft Outlook');
export const ImapProviderStub = new RealApiEmailProvider('imap', 'IMAP Mail');
