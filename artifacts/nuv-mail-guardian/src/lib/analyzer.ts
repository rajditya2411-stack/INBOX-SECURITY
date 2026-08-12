/*
 Adapter preserving the original analyzer API while delegating to the new Security Engine.
 This file replaces the previous inline analyzer with a thin mapping layer.
*/

import type { MailMessage } from '@/data/messages';
import { analyzeNormalizedEmail, type NormalizedEmail, type EngineResult } from './security-engine';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AnalysisSignalKey =
  | 'externalSender'
  | 'suspiciousLanguage'
  | 'urgencyDetected'
  | 'paymentRequest'
  | 'credentialRequest'
  | 'suspiciousLink'
  | 'lookalikeDomain'
  | 'riskyAttachment';

export type SecurityAnalysis = {
  externalSender: boolean;
  suspiciousLanguage: boolean;
  urgencyDetected: boolean;
  paymentRequest: boolean;
  credentialRequest: boolean;
  suspiciousLink: boolean;
  lookalikeDomain: boolean;
  riskyAttachment: boolean;
  riskLevel: RiskLevel;
  score: number;
  flagged: boolean;
  signals: AnalysisSignalKey[];
  recommendation: string;
  authentication?: {
    spf?: 'PASS' | 'FAIL' | 'UNAVAILABLE';
    dkim?: 'PASS' | 'FAIL' | 'UNAVAILABLE';
    dmarc?: 'PASS' | 'FAIL' | 'UNAVAILABLE';
  } | null;
};

export function normalizeDomain(domain: string) {
  return domain.trim().toLowerCase().replace(/^@/, '').replace(/\.$/, '');
}

function toNormalized(message: MailMessage): NormalizedEmail {
  return {
    id: message.id,
    threadId: message.id,
    provider: 'demo',
    from: { name: message.senderName, email: message.senderEmail },
    to: [],
    cc: [],
    subject: message.subject,
    text: [message.preview, ...message.body].join('\n\n'),
    html: undefined,
    timestamp: message.time,
    attachments: message.attachments ?? [],
    rawHeaders: {},
  };
}

export function analyzeEmail(message: MailMessage, trustedDomains: string[]): SecurityAnalysis {
  const normalized = toNormalized(message);
  const result: EngineResult = analyzeNormalizedEmail(normalized, trustedDomains);

  return {
    externalSender: result.signals.externalSender,
    suspiciousLanguage: result.signals.suspiciousLanguage,
    urgencyDetected: result.signals.urgencyDetected,
    paymentRequest: result.signals.paymentRequest,
    credentialRequest: result.signals.credentialRequest,
    suspiciousLink: result.signals.suspiciousLink,
    lookalikeDomain: result.signals.lookalikeDomain,
    riskyAttachment: result.signals.riskyAttachment,
    riskLevel: result.riskLevel,
    score: result.score,
    flagged: result.signalsFound,
    signals: result.signalsList as AnalysisSignalKey[],
    recommendation: result.recommendation,
    authentication: result.authentication ?? null,
  };
}

export function analyzeMessages(items: MailMessage[], trustedDomains: string[]) {
  return Object.fromEntries(items.map((message) => [message.id, analyzeEmail(message, trustedDomains)])) as Record<string, SecurityAnalysis>;
}
