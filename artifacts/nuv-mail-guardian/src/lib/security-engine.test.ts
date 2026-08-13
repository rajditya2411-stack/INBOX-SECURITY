import { describe, it, expect } from 'vitest';
import { analyzeNormalizedEmail, type NormalizedEmail } from './security-engine';

describe('Security Engine (Deterministic Analysis)', () => {
  const trustedDomains = ['company.com', 'trusted-vendor.com'];

  it('evaluates safe internal email as LOW risk', () => {
    const email: NormalizedEmail = {
      id: 'safe-1',
      from: { name: 'Alex', email: 'alex@company.com' },
      to: [{ email: 'you@company.com' }],
      subject: 'Team sync meeting',
      text: 'Hi team, let us meet tomorrow to review our project progress.',
    };

    const res = analyzeNormalizedEmail(email, trustedDomains);
    expect(res.signals.externalSender).toBe(false);
    expect(res.signals.suspiciousLanguage).toBe(false);
    expect(res.riskLevel).toBe('LOW');
    expect(res.score).toBe(0);
  });

  it('detects external sender flag when domain is untrusted', () => {
    const email: NormalizedEmail = {
      id: 'ext-1',
      from: { name: 'External Partner', email: 'partner@external.org' },
      to: [{ email: 'you@company.com' }],
      subject: 'Collaboration notes',
      text: 'Here are the notes from our discussion.',
    };

    const res = analyzeNormalizedEmail(email, trustedDomains);
    expect(res.signals.externalSender).toBe(true);
    expect(res.score).toBeGreaterThanOrEqual(1);
  });

  it('flags urgency, credential requests, and suspicious links in phishing emails', () => {
    const email: NormalizedEmail = {
      id: 'phish-1',
      from: { name: 'Account Security', email: 'alert@secures-login-portal.net' },
      to: [{ email: 'you@company.com' }],
      subject: 'URGENT: Verify Your Account immediately',
      text: 'Your account will be disabled within 24 hours unless you verify your password at http://secures-login-portal.net/verify',
    };

    const res = analyzeNormalizedEmail(email, trustedDomains);
    expect(res.signals.urgencyDetected).toBe(true);
    expect(res.signals.credentialRequest).toBe(true);
    expect(res.signals.suspiciousLink).toBe(true);
    expect(['HIGH', 'CRITICAL']).toContain(res.riskLevel);
  });

  it('flags risky attachments and payment requests resulting in CRITICAL or HIGH risk', () => {
    const email: NormalizedEmail = {
      id: 'malware-1',
      from: { name: 'Scammer', email: 'scam@suspicious.xyz' },
      to: [{ email: 'you@company.com' }],
      subject: 'URGENT: Immediate wire transfer invoice payment',
      text: 'Process urgent bank transfer immediately. Verify credentials and OTP passcode.',
      attachments: ['invoice_document.exe'],
    };

    const res = analyzeNormalizedEmail(email, trustedDomains);
    expect(res.signals.paymentRequest).toBe(true);
    expect(res.signals.riskyAttachment).toBe(true);
    expect(res.score).toBeGreaterThanOrEqual(7);
    expect(res.riskLevel).toBe('CRITICAL');
  });
});
