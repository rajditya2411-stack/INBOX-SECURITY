import type { NormalizedEmail } from '../security-engine';

export type ProviderStatus = 'DEMO' | 'NOT_CONFIGURED' | 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';

export type EmailFolder = {
  id: string;
  name: string;
  type?: 'inbox' | 'sent' | 'drafts' | 'spam' | 'trash' | 'other';
};

export type ListMessagesOptions = {
  folderId?: string;
  limit?: number;
};

export type CreateMessagePayload = {
  to: string;
  subject: string;
  body: string;
  inReplyTo?: string;
};

export interface EmailProvider {
  id: string;
  name: string;

  getStatus(): Promise<ProviderStatus>;

  listMessages(options?: ListMessagesOptions): Promise<NormalizedEmail[]>;

  getMessage(id: string): Promise<NormalizedEmail | null>;

  listFolders(): Promise<EmailFolder[]>;

  sendMessage?(payload: CreateMessagePayload): Promise<NormalizedEmail>;

  saveDraft?(payload: CreateMessagePayload): Promise<NormalizedEmail>;
}
