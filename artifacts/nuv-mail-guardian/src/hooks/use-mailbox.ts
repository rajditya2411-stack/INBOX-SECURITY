import { useCallback, useEffect, useMemo, useState } from 'react';
import { getProvider, getDefaultProvider, type CreateMessagePayload } from '@/lib/providers';
import { useSecuritySettings } from '@/hooks/use-security-settings';
import { messages as demoMessages, type MailMessage } from '@/data/messages';
import type { NormalizedEmail } from '@/lib/security-engine';
import { analyzeMessages, type SecurityAnalysis } from '@/lib/analyzer';

type UseMailboxResult = {
  messages: MailMessage[];
  analyses: Record<string, SecurityAnalysis>;
  loading: boolean;
  error: string | null;
  sendMessage: (payload: CreateMessagePayload) => Promise<MailMessage>;
  saveDraft: (payload: CreateMessagePayload) => Promise<MailMessage>;
  refresh: () => Promise<void>;
};

function normalizedToMailMessage(norm: NormalizedEmail, folderOverride?: 'inbox' | 'sent' | 'drafts' | 'spam' | 'trash'): MailMessage {
  return {
    id: norm.id,
    senderName: norm.from?.name ?? (norm.from?.email?.split('@')[0] ?? 'Unknown'),
    senderEmail: norm.from?.email ?? '',
    subject: norm.subject ?? '',
    preview: (norm.text || '').split('\n')[0].slice(0, 240),
    time: typeof norm.timestamp === 'string' ? norm.timestamp : String(norm.timestamp ?? ''),
    body: (norm.text || '') ? (norm.text || '').split('\n\n') : [],
    attachments: norm.attachments ?? [],
    folder: folderOverride ?? (norm.from?.email === 'you@company.com' ? 'sent' : 'inbox'),
  };
}

export function useMailbox(folderId: string = 'inbox'): UseMailboxResult {
  const { settings } = useSecuritySettings();
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = getProvider(settings.emailProvider) ?? getDefaultProvider();
      const norms = await provider.listMessages({ folderId, limit: 1000 });
      const converted = norms.map((norm) => normalizedToMailMessage(norm, folderId as any));
      setMessages(converted);
    } catch (err: any) {
      try {
        const fallback = demoMessages.filter((m) => (folderId === 'all' ? true : (m.folder ?? 'inbox') === folderId));
        setMessages(fallback);
      } catch {
        setMessages([]);
      }
      setError(err?.message ?? String(err ?? 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [settings.emailProvider, folderId]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  const sendMessage = useCallback(async (payload: CreateMessagePayload) => {
    const provider = getProvider(settings.emailProvider) ?? getDefaultProvider();
    if (!provider.sendMessage) {
      throw new Error(`Provider ${provider.name} does not support sending messages.`);
    }
    const norm = await provider.sendMessage(payload);
    const msg = normalizedToMailMessage(norm, 'sent');
    await loadMessages();
    return msg;
  }, [settings.emailProvider, loadMessages]);

  const saveDraft = useCallback(async (payload: CreateMessagePayload) => {
    const provider = getProvider(settings.emailProvider) ?? getDefaultProvider();
    if (!provider.saveDraft) {
      throw new Error(`Provider ${provider.name} does not support saving drafts.`);
    }
    const norm = await provider.saveDraft(payload);
    const msg = normalizedToMailMessage(norm, 'drafts');
    await loadMessages();
    return msg;
  }, [settings.emailProvider, loadMessages]);

  const analyses = useMemo(() => analyzeMessages(messages, settings.trustedDomains), [messages, settings.trustedDomains]);

  return { messages, analyses, loading, error, sendMessage, saveDraft, refresh: loadMessages };
}
