import type { EmailProvider, ListMessagesOptions, CreateMessagePayload, EmailFolder } from './types';
import { messages as initialMessages, type MailMessage } from '@/data/messages';
import type { NormalizedEmail } from '../security-engine';

function toNormalized(message: MailMessage): NormalizedEmail {
  return {
    id: message.id,
    threadId: message.id,
    provider: 'demo',
    from: { name: message.senderName, email: message.senderEmail },
    to: [{ email: message.folder === 'sent' ? 'recipient@company.com' : 'you@company.com' }],
    cc: [],
    subject: message.subject,
    text: [message.preview, ...message.body].join('\n\n'),
    html: undefined,
    timestamp: message.time,
    attachments: message.attachments ?? [],
    rawHeaders: {},
  };
}

export class DemoEmailProvider implements EmailProvider {
  id = 'demo';
  name = 'Demo Provider';
  private messageStore: MailMessage[] = [...initialMessages];

  async getStatus() {
    return 'DEMO' as const;
  }

  async listMessages(options?: ListMessagesOptions): Promise<NormalizedEmail[]> {
    const folder = options?.folderId ?? 'inbox';
    const limit = options?.limit ?? this.messageStore.length;
    const filtered = this.messageStore.filter((m) => (folder === 'all' ? true : (m.folder ?? 'inbox') === folder));
    return filtered.slice(0, limit).map(toNormalized);
  }

  async getMessage(id: string): Promise<NormalizedEmail | null> {
    const m = this.messageStore.find((x) => x.id === id);
    return m ? toNormalized(m) : null;
  }

  async listFolders(): Promise<EmailFolder[]> {
    return [
      { id: 'inbox', name: 'Inbox', type: 'inbox' },
      { id: 'sent', name: 'Sent', type: 'sent' },
      { id: 'drafts', name: 'Drafts', type: 'drafts' },
      { id: 'spam', name: 'Spam', type: 'spam' },
      { id: 'trash', name: 'Trash', type: 'trash' },
    ];
  }

  async sendMessage(payload: CreateMessagePayload): Promise<NormalizedEmail> {
    const nowStr = 'Just now';
    const newMessage: MailMessage = {
      id: `sent-demo-${Date.now()}`,
      senderName: 'You',
      senderEmail: 'you@company.com',
      subject: payload.subject || '(No Subject)',
      preview: payload.body.split('\n')[0].slice(0, 160) || '(No Content)',
      time: nowStr,
      body: payload.body.split('\n').filter(Boolean),
      folder: 'sent',
    };
    this.messageStore.unshift(newMessage);
    return toNormalized(newMessage);
  }

  async saveDraft(payload: CreateMessagePayload): Promise<NormalizedEmail> {
    const nowStr = 'Just now';
    const draftMessage: MailMessage = {
      id: `draft-demo-${Date.now()}`,
      senderName: 'You',
      senderEmail: 'you@company.com',
      subject: payload.subject ? `Draft: ${payload.subject}` : 'Draft: (No Subject)',
      preview: payload.body.split('\n')[0].slice(0, 160) || 'Unfinished draft',
      time: nowStr,
      body: payload.body.split('\n').filter(Boolean),
      folder: 'drafts',
    };
    this.messageStore.unshift(draftMessage);
    return toNormalized(draftMessage);
  }
}
