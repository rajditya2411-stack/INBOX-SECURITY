/*
 Security Engine: a non-React, deterministic analyzer for normalized emails.
 Designed to be imported by the existing analyzer.ts adapter.
*/

export type NormalizedAddress = { name?: string; email: string };

export type NormalizedEmail = {
  id: string;
  threadId?: string;
  provider?: string; // e.g., 'demo', 'gmail', 'imap'
  from: NormalizedAddress;
  to: NormalizedAddress[];
  cc?: NormalizedAddress[];
  subject?: string;
  text?: string; // plain/text concatenation
  html?: string | undefined;
  timestamp?: string | number;
  attachments?: string[]; // filenames
  rawHeaders?: Record<string, string>;
};

export type SignalSet = {
  externalSender: boolean;
  suspiciousLanguage: boolean;
  urgencyDetected: boolean;
  paymentRequest: boolean;
  credentialRequest: boolean;
  suspiciousLink: boolean;
  lookalikeDomain: boolean;
  riskyAttachment: boolean;
};

export type AuthenticationMeta = {
  spf?: 'PASS' | 'FAIL' | 'UNAVAILABLE';
  dkim?: 'PASS' | 'FAIL' | 'UNAVAILABLE';
  dmarc?: 'PASS' | 'FAIL' | 'UNAVAILABLE';
};

export type EngineResult = {
  id: string;
  signals: SignalSet;
  signalsList: string[];
  signalsFound: boolean;
  score: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendation: string;
  authentication?: AuthenticationMeta | null;
};

// Phrase lists (kept small and deterministic).
const suspiciousLanguagePhrases = [
  'verify your account',
  'account suspended',
  'final warning',
  'action required',
  'click immediately',
  'confirm your password',
  'payment required',
  'send payment',
  'limited time',
];

const urgencyPhrases = [
  'within 24 hours',
  'immediately',
  'today',
  'final notice',
  'last chance',
  'will be disabled',
  'will be restricted',
];

const paymentPhrases = [
  'payment',
  'invoice',
  'bank transfer',
  'upi',
  'fee',
  'wire transfer',
  'payment link',
  'payroll',
];

const credentialPhrases = [
  'password',
  'login',
  'verify account',
  'otp',
  'credentials',
  'authentication',
  'sign in',
];

const shortenerDomains = ['bit.ly', 'tinyurl.com', 't.co'];
const riskyExtensions = ['.exe', '.scr', '.bat', '.cmd', '.js', '.vbs', '.ps1', '.zip', '.rar', '.iso', '.docm', '.xlsm'];

function normalizeDomain(domain: string) {
  return domain.trim().toLowerCase().replace(/^@/, '').replace(/\.$/, '');
}

function extractDomainFromEmail(email: string) {
  const normalized = (email || '').trim().toLowerCase();
  const at = normalized.indexOf('@');
  if (at <= 0 || at !== normalized.lastIndexOf('@')) return '';
  return normalizeDomain(normalized.slice(at + 1));
}

function containsPhrase(text: string, phrases: string[]) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return phrases.some((p) => lower.includes(p));
}

function extractLinksFromText(text: string) {
  if (!text) return [] as string[];
  // Simple https? links
  const matches = text.match(/\bhttps?:\/\/[\w\-@:%._\+~#?&//=]+/gi) || [];
  return matches;
}

function extractLinksFromHtml(html?: string) {
  if (!html) return [] as string[];
  // find href="..."
  const hrefs: string[] = [];
  const re = /href\s*=\s*\"([^\"]+)\"/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    if (m[1]) hrefs.push(m[1]);
  }
  return hrefs;
}

function isShortenerHost(host: string) {
  return shortenerDomains.includes(host);
}

function isLookalikeDomain(domain: string, trustedDomains: string[]) {
  const normalized = normalizeDomain(domain || '');
  const label = normalized.split('.')[0] || '';
  return trustedDomains.some((trustedDomain) => {
    const trustedLabel = normalizeDomain(trustedDomain).split('.')[0] || '';
    if (!trustedLabel || normalized === normalizeDomain(trustedDomain)) return false;
    const characterLookalike = label.replace(/0/g, 'o').replace(/1/g, 'l').replace(/3/g, 'e').replace(/5/g, 's') === trustedLabel;
    const brandedPath = label.startsWith(`${trustedLabel}-`) && /login|security|verify|support|account/.test(label);
    return characterLookalike || brandedPath;
  });
}

function analyzeLinks(links: string[], trustedDomains: string[]) {
  // returns whether we consider any of the links suspicious
  for (const link of links) {
    try {
      const u = new URL(link, 'http://example/');
      const host = normalizeDomain(u.hostname || '');
      const suspiciousPath = /login|verify|password|payment|account|secure/.test((host + u.pathname).toLowerCase());
      const httpInsecure = u.protocol === 'http:';
      const shortener = isShortenerHost(host);
      const lookalike = isLookalikeDomain(host, trustedDomains);
      if (httpInsecure || shortener || suspiciousPath || lookalike) return true;
    } catch (err) {
      // malformed URL — treat as suspicious conservative fallback
      return true;
    }
  }
  return false;
}

function riskyAttachmentDetected(attachments: string[] = []) {
  return attachments.some((name) => {
    const n = (name || '').toLowerCase();
    return riskyExtensions.some((ext) => n.endsWith(ext));
  });
}

function recommendationFor(signals: string[]) {
  if (signals.includes('credentialRequest')) return 'Verify the request through a known official channel before clicking links or sharing credentials.';
  if (signals.includes('paymentRequest')) return 'Verify the request through a known official channel before making payments or sharing financial information.';
  if (signals.includes('suspiciousLink')) return 'Do not open the link. Verify the destination through a known official channel first.';
  if (signals.includes('riskyAttachment')) return 'Do not open the attachment unless you can verify the sender and file through an official channel.';
  if (signals.includes('externalSender')) return 'External does not automatically mean malicious. Verify the request through a known official channel before acting.';
  return 'Review the message carefully and verify unusual requests through a known official channel.';
}

export function analyzeNormalizedEmail(email: NormalizedEmail, trustedDomains: string[]): EngineResult {
  const id = email.id;
  const text = (email.text || '') + '\n' + (email.subject || '');
  const html = email.html;
  const senderDomain = extractDomainFromEmail(email.from?.email || '');
  const trustedNormalized = trustedDomains.map(normalizeDomain).filter(Boolean);

  const externalSender = Boolean(senderDomain) && !trustedNormalized.includes(senderDomain);
  const suspiciousLanguage = containsPhrase(text, suspiciousLanguagePhrases) || containsPhrase(email.subject || '', suspiciousLanguagePhrases);
  const urgencyDetected = containsPhrase(text, urgencyPhrases);
  const paymentRequest = containsPhrase(text, paymentPhrases);
  const credentialRequest = containsPhrase(text, credentialPhrases);

  // Aggregate links from text and html
  const links = [...extractLinksFromText(text), ...extractLinksFromHtml(html)];
  const suspiciousLink = analyzeLinks(links, trustedNormalized);

  const lookalikeDomain = Boolean(senderDomain) && isLookalikeDomain(senderDomain, trustedNormalized);
  const riskyAttachment = riskyAttachmentDetected(email.attachments || []);

  const signalsObj: SignalSet = {
    externalSender,
    suspiciousLanguage,
    urgencyDetected,
    paymentRequest,
    credentialRequest,
    suspiciousLink,
    lookalikeDomain,
    riskyAttachment,
  };

  const signalsList = (Object.keys(signalsObj) as Array<keyof SignalSet>).filter((k) => signalsObj[k]);
  const signalsFound = signalsList.length > 0;

  // Scoring weights (explainable, deterministic)
  const weights: Record<keyof SignalSet, number> = {
    externalSender: 1,
    suspiciousLanguage: 1,
    urgencyDetected: 1,
    paymentRequest: 2,
    credentialRequest: 2,
    suspiciousLink: 2,
    lookalikeDomain: 2,
    riskyAttachment: 3,
  };

  const score = signalsList.reduce((sum, sig) => sum + (weights[sig as keyof SignalSet] || 0), 0);

  // Risk thresholds (conservative and explainable)
  let riskLevel: EngineResult['riskLevel'] = 'LOW';
  if (score >= 7) riskLevel = 'CRITICAL';
  else if (score >= 4) riskLevel = 'HIGH';
  else if (score >= 2) riskLevel = 'MEDIUM';
  else riskLevel = 'LOW';

  const recommendation = recommendationFor(signalsList);

  // Authentication metadata is not available in demo mode: mark as UNAVAILABLE
  const authentication: AuthenticationMeta = {
    spf: 'UNAVAILABLE',
    dkim: 'UNAVAILABLE',
    dmarc: 'UNAVAILABLE',
  };

  return {
    id,
    signals: signalsObj,
    signalsList,
    signalsFound,
    score,
    riskLevel,
    recommendation,
    authentication,
  };
}
