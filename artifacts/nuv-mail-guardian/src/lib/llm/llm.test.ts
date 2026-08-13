import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getLLMProvider, OpenAIProvider, GeminiProvider, AnthropicProvider, GrokProvider, NoneProvider } from './stubs';
import type { MailMessage } from '@/data/messages';
import type { SecurityAnalysis } from '@/lib/analyzer';

describe('LLM Adapters & Provider Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockMessage: MailMessage = {
    id: 'test-1',
    senderName: 'Bank Support',
    senderEmail: 'support@bank-security-phish.com',
    subject: 'URGENT: Password Reset Required',
    preview: 'Please reset your password immediately.',
    body: ['Dear Customer, please reset your password by clicking the link.'],
    time: '10:00 AM',
    read: false,
    folder: 'inbox',
  };

  const mockAnalysis: SecurityAnalysis = {
    externalSender: true,
    suspiciousLanguage: true,
    urgencyDetected: true,
    paymentRequest: false,
    credentialRequest: true,
    suspiciousLink: true,
    lookalikeDomain: true,
    riskyAttachment: false,
    riskLevel: 'HIGH',
    score: 85,
    flagged: true,
    signals: ['externalSender', 'urgencyDetected', 'credentialRequest'],
    recommendation: 'Do not click links or provide credentials.',
  };

  it('NoneProvider returns available: false and explains rule-based engine remains active', async () => {
    const result = await NoneProvider.analyze(mockMessage, mockAnalysis);
    expect(result.available).toBe(false);
    expect(result.providerId).toBe('none');
    expect(result.error).toContain('None');
  });

  it('getLLMProvider retrieves correct provider instance', () => {
    expect(getLLMProvider('openai')).toBe(OpenAIProvider);
    expect(getLLMProvider('gemini')).toBe(GeminiProvider);
    expect(getLLMProvider('anthropic')).toBe(AnthropicProvider);
    expect(getLLMProvider('grok')).toBe(GrokProvider);
    expect(getLLMProvider('unknown')).toBe(NoneProvider);
  });

  it('LLM provider calls backend proxy endpoint /api/ai/analyze', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      if (typeof url === 'string' && url.includes('/api/ai/analyze')) {
        return new Response(
          JSON.stringify({
            available: true,
            providerId: 'openai',
            modelUsed: 'gpt-4o-mini',
            riskLevel: 'HIGH',
            confidence: 0.98,
            summary: 'Suspicious credential harvesting email detected.',
            reasons: ['Urgent tone', 'Credential request'],
            recommendedAction: 'Report and delete.',
          }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    });

    const result = await OpenAIProvider.analyze(mockMessage, mockAnalysis, 'sk-test-123', 'gpt-4o-mini');
    expect(result.available).toBe(true);
    expect(result.providerId).toBe('openai');
    expect(result.summary).toBe('Suspicious credential harvesting email detected.');
    expect(result.riskLevel).toBe('HIGH');
  });

  it('LLM provider falls back gracefully when backend server returns error or is offline', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response('Internal Server Error', { status: 500 });
    });

    const result = await GeminiProvider.analyze(mockMessage, mockAnalysis, '', 'gemini-1.5-flash');
    expect(result.available).toBe(false);
    expect(result.providerId).toBe('gemini');
    expect(result.summary).toContain('Fallback');
    expect(result.riskLevel).toBe('HIGH');
  });

  it('testConnection returns server test result', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      if (typeof url === 'string' && url.includes('/api/ai/test')) {
        return new Response(
          JSON.stringify({ success: true, message: 'Successfully connected to ANTHROPIC (claude-3-5-haiku).' }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify({ success: false, message: 'Failed' }), { status: 400 });
    });

    const testRes = await AnthropicProvider.testConnection('test-key', 'claude-3-5-haiku');
    expect(testRes.success).toBe(true);
    expect(testRes.message).toContain('Successfully connected');
  });
});
