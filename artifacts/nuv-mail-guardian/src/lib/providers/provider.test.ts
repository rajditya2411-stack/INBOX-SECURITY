import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DemoEmailProvider } from './demo';
import { RealApiEmailProvider } from './stubs';
import { getProvider, getDefaultProvider } from './registry';
import { evaluateSecuritySignals, type NormalizedEmail } from '../security-engine';

describe('EmailProvider Contracts & Security Pipeline', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('DemoEmailProvider implements EmailProvider contract and lists demo messages', async () => {
    const demo = getDefaultProvider();
    expect(demo.id).toBe('demo');
    const status = await demo.getStatus();
    expect(status).toBe('CONNECTED');

    const messages = await demo.listMessages();
    expect(messages.length).toBeGreaterThan(0);

    const folders = await demo.listFolders();
    expect(folders.length).toBeGreaterThan(0);
  });

  it('RealApiEmailProvider returns NOT_CONFIGURED when backend account is unconfigured', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(JSON.stringify({ accounts: [] }), { status: 200 });
    });

    const gmail = new RealApiEmailProvider('gmail', 'Gmail');
    const status = await gmail.getStatus();
    expect(status).toBe('NOT_CONFIGURED');
  });

  it('RealApiEmailProvider fetches and normalizes messages when connected', async () => {
    const mockNormalized: NormalizedEmail[] = [
      {
        id: 'msg-real-1',
        from: { name: 'Urgent Security Test', email: 'security@phish-domain.com' },
        to: [{ email: 'user@company.com' }],
        subject: 'URGENT: Verify your account credentials now!',
        text: 'Please click http://bit.ly/verify to verify your bank password immediately.',
        timestamp: new Date().toISOString(),
      },
    ];

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      if (typeof url === 'string' && url.includes('/api/messages')) {
        return new Response(JSON.stringify({ messages: mockNormalized }), { status: 200 });
      }
      return new Response(JSON.stringify({ accounts: [{ provider: 'gmail', status: 'CONNECTED' }] }), { status: 200 });
    });

    const gmail = new RealApiEmailProvider('gmail', 'Gmail');
    const messages = await gmail.listMessages({ folderId: 'inbox' });
    expect(messages.length).toBe(1);
    expect(messages[0].id).toBe('msg-real-1');

    // Verify normalized email passes through deterministic security engine
    const analysis = evaluateSecuritySignals(messages[0], ['company.com']);
    expect(analysis.flagged).toBe(true);
    expect(analysis.riskScore).toBeGreaterThan(0);
    expect(analysis.signals.some((s) => s.key === 'externalSender')).toBe(true);
    expect(analysis.signals.some((s) => s.key === 'urgency')).toBe(true);
  });

  it('Provider registry returns configured provider instances', () => {
    const gmail = getProvider('gmail');
    expect(gmail?.id).toBe('gmail');

    const outlook = getProvider('outlook');
    expect(outlook?.id).toBe('microsoft');

    const imap = getProvider('imap');
    expect(imap?.id).toBe('imap');
  });
});
