import { saveAccount, getAccount, type StoredAccount } from './account-store';

export type NormalizedAddress = { name?: string; email: string };
export type NormalizedEmail = {
  id: string;
  threadId?: string;
  provider?: string;
  from: NormalizedAddress;
  to: NormalizedAddress[];
  cc?: NormalizedAddress[];
  subject?: string;
  text?: string;
  html?: string;
  timestamp?: string | number;
  attachments?: string[];
  rawHeaders?: Record<string, string>;
};

export type EmailFolder = {
  id: string;
  name: string;
  type?: 'inbox' | 'sent' | 'drafts' | 'spam' | 'trash' | 'other';
};

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

export function getGoogleAuthUrl(): { url: string; configured: boolean } {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/settings';

  if (!clientId) {
    return { url: '', configured: false };
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email',
    access_type: 'offline',
    prompt: 'consent',
  });

  return { url: `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`, configured: true };
}

export async function handleGoogleCallback(code: string): Promise<StoredAccount> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/settings';

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured on server.');
  }

  const tokenRes = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`Failed to exchange Google OAuth code: ${errText}`);
  }

  const tokenData: any = await tokenRes.json();
  const accessToken = tokenData.access_token;
  const refreshToken = tokenData.refresh_token;
  const expiresIn = tokenData.expires_in || 3600;

  // Fetch profile to get email address
  const profileRes = await fetch(`${GMAIL_API_BASE}/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  let emailAddress = 'gmail-user@gmail.com';
  if (profileRes.ok) {
    const profile: any = await profileRes.json();
    emailAddress = profile.emailAddress || emailAddress;
  }

  const accountId = `gmail-${emailAddress.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const account: StoredAccount = {
    id: accountId,
    provider: 'gmail',
    emailAddress,
    status: 'CONNECTED',
    tokens: {
      accessToken,
      refreshToken,
      expiresAt: Date.now() + expiresIn * 1000,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return saveAccount(account);
}

async function ensureGmailAccessToken(account: StoredAccount): Promise<string> {
  if (!account.tokens) throw new Error('Account tokens missing');
  if (account.tokens.expiresAt && Date.now() < account.tokens.expiresAt - 60000 && account.tokens.accessToken) {
    return account.tokens.accessToken;
  }

  if (!account.tokens.refreshToken) {
    throw new Error('Refresh token missing for Gmail account');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured');
  }

  const refreshRes = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: account.tokens.refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!refreshRes.ok) {
    account.status = 'EXPIRED';
    await saveAccount(account);
    throw new Error('Failed to refresh Gmail access token');
  }

  const data: any = await refreshRes.json();
  const newAccessToken = data.access_token;
  const expiresIn = data.expires_in || 3600;

  account.tokens.accessToken = newAccessToken;
  account.tokens.expiresAt = Date.now() + expiresIn * 1000;
  account.status = 'CONNECTED';
  await saveAccount(account);

  return newAccessToken;
}

export async function fetchGmailFolders(accountId: string): Promise<EmailFolder[]> {
  const account = await getAccount(accountId);
  if (!account) throw new Error('Gmail account not found');
  const token = await ensureGmailAccessToken(account);

  const res = await fetch(`${GMAIL_API_BASE}/labels`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Failed to fetch Gmail labels');

  const data: any = await res.json();
  const labels: Array<{ id: string; name: string; type: string }> = data.labels || [];

  return labels.map((l) => {
    let type: EmailFolder['type'] = 'other';
    const nameUpper = l.name.toUpperCase();
    if (nameUpper === 'INBOX') type = 'inbox';
    else if (nameUpper === 'SENT') type = 'sent';
    else if (nameUpper === 'DRAFT' || nameUpper === 'DRAFTS') type = 'drafts';
    else if (nameUpper === 'SPAM' || nameUpper === 'JUNK') type = 'spam';
    else if (nameUpper === 'TRASH') type = 'trash';

    return {
      id: l.id.toLowerCase(),
      name: l.name,
      type,
    };
  });
}

export async function fetchGmailMessages(accountId: string, folderId = 'inbox', limit = 20): Promise<NormalizedEmail[]> {
  const account = await getAccount(accountId);
  if (!account) throw new Error('Gmail account not found');
  const token = await ensureGmailAccessToken(account);

  let labelId = folderId.toUpperCase();
  if (labelId === 'INBOX') labelId = 'INBOX';
  else if (labelId === 'SENT') labelId = 'SENT';
  else if (labelId === 'DRAFTS') labelId = 'DRAFT';
  else if (labelId === 'SPAM') labelId = 'SPAM';
  else if (labelId === 'TRASH') labelId = 'TRASH';

  const listUrl = `${GMAIL_API_BASE}/messages?maxResults=${limit}&includeSpamTrash=true${labelId !== 'ALL' ? `&q=label:${labelId}` : ''}`;
  const listRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!listRes.ok) throw new Error('Failed to list Gmail messages');

  const listData: any = await listRes.json();
  const messageSummaries: Array<{ id: string; threadId: string }> = listData.messages || [];

  const normalized: NormalizedEmail[] = [];
  for (const item of messageSummaries.slice(0, limit)) {
    try {
      const msgRes = await fetch(`${GMAIL_API_BASE}/messages/${item.id}?format=full`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!msgRes.ok) continue;
      const m: any = await msgRes.json();

      const headers: Record<string, string> = {};
      (m.payload?.headers || []).forEach((h: { name: string; value: string }) => {
        headers[h.name.toLowerCase()] = h.value;
      });

      const fromRaw = headers['from'] || '';
      const fromMatch = fromRaw.match(/(?:"?([^"]*)"?\s)?(?:<(.+)>)/) || [null, '', fromRaw];
      const fromName = fromMatch[1] || fromMatch[2] || fromRaw;
      const fromEmail = fromMatch[2] || fromRaw;

      const subject = headers['subject'] || '(No Subject)';
      const dateStr = headers['date'] || new Date().toISOString();

      let bodyText = m.snippet || '';
      let attachments: string[] = [];

      normalized.push({
        id: m.id,
        threadId: m.threadId,
        provider: 'gmail',
        from: { name: fromName, email: fromEmail },
        to: [{ email: account.emailAddress }],
        subject,
        text: bodyText,
        timestamp: dateStr,
        attachments,
        rawHeaders: headers,
      });
    } catch {
      continue;
    }
  }

  return normalized;
}
