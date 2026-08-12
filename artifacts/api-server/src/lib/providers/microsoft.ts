import { saveAccount, getAccount, type StoredAccount } from './account-store';
import type { NormalizedEmail, EmailFolder } from './gmail';

const MS_AUTH_ENDPOINT = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const MS_TOKEN_ENDPOINT = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0/me';

export function getMicrosoftAuthUrl(): { url: string; configured: boolean } {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const redirectUri = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:5173/settings';

  if (!clientId) {
    return { url: '', configured: false };
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'offline_access User.Read Mail.Read',
    response_mode: 'query',
  });

  return { url: `${MS_AUTH_ENDPOINT}?${params.toString()}`, configured: true };
}

export async function handleMicrosoftCallback(code: string): Promise<StoredAccount> {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const redirectUri = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:5173/settings';

  if (!clientId || !clientSecret) {
    throw new Error('Microsoft OAuth credentials not configured on server.');
  }

  const tokenRes = await fetch(MS_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`Failed to exchange Microsoft OAuth code: ${errText}`);
  }

  const tokenData: any = await tokenRes.json();
  const accessToken = tokenData.access_token;
  const refreshToken = tokenData.refresh_token;
  const expiresIn = tokenData.expires_in || 3600;

  // Fetch Microsoft User Profile
  const profileRes = await fetch(GRAPH_API_BASE, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  let emailAddress = 'outlook-user@outlook.com';
  if (profileRes.ok) {
    const profile: any = await profileRes.json();
    emailAddress = profile.mail || profile.userPrincipalName || emailAddress;
  }

  const accountId = `microsoft-${emailAddress.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const account: StoredAccount = {
    id: accountId,
    provider: 'microsoft',
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

async function ensureMicrosoftAccessToken(account: StoredAccount): Promise<string> {
  if (!account.tokens) throw new Error('Account tokens missing');
  if (account.tokens.expiresAt && Date.now() < account.tokens.expiresAt - 60000 && account.tokens.accessToken) {
    return account.tokens.accessToken;
  }

  if (!account.tokens.refreshToken) {
    throw new Error('Refresh token missing for Microsoft account');
  }

  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Microsoft OAuth credentials not configured');
  }

  const refreshRes = await fetch(MS_TOKEN_ENDPOINT, {
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
    throw new Error('Failed to refresh Microsoft access token');
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

export async function fetchMicrosoftFolders(accountId: string): Promise<EmailFolder[]> {
  const account = await getAccount(accountId);
  if (!account) throw new Error('Microsoft account not found');
  const token = await ensureMicrosoftAccessToken(account);

  const res = await fetch(`${GRAPH_API_BASE}/mailFolders`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Failed to fetch Microsoft mail folders');

  const data: any = await res.json();
  const folders: Array<{ id: string; displayName: string }> = data.value || [];

  return folders.map((f) => {
    let type: EmailFolder['type'] = 'other';
    const nameUpper = f.displayName.toUpperCase();
    if (nameUpper.includes('INBOX')) type = 'inbox';
    else if (nameUpper.includes('SENT')) type = 'sent';
    else if (nameUpper.includes('DRAFT')) type = 'drafts';
    else if (nameUpper.includes('JUNK') || nameUpper.includes('SPAM')) type = 'spam';
    else if (nameUpper.includes('DELETED') || nameUpper.includes('TRASH')) type = 'trash';

    return {
      id: f.id,
      name: f.displayName,
      type,
    };
  });
}

export async function fetchMicrosoftMessages(accountId: string, folderId = 'inbox', limit = 20): Promise<NormalizedEmail[]> {
  const account = await getAccount(accountId);
  if (!account) throw new Error('Microsoft account not found');
  const token = await ensureMicrosoftAccessToken(account);

  let endpoint = `${GRAPH_API_BASE}/mailFolders/inbox/messages`;
  if (folderId === 'sent') endpoint = `${GRAPH_API_BASE}/mailFolders/sentitems/messages`;
  else if (folderId === 'drafts') endpoint = `${GRAPH_API_BASE}/mailFolders/drafts/messages`;
  else if (folderId === 'spam') endpoint = `${GRAPH_API_BASE}/mailFolders/junkemail/messages`;
  else if (folderId === 'trash') endpoint = `${GRAPH_API_BASE}/mailFolders/deleteditems/messages`;

  const url = `${endpoint}?$top=${limit}&$select=id,subject,bodyPreview,body,from,toRecipients,receivedDateTime,hasAttachments`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Failed to fetch Microsoft Graph messages');

  const data: any = await res.json();
  const items: Array<any> = data.value || [];

  return items.map((m) => {
    const sender = m.from?.emailAddress;
    const fromName = sender?.name || sender?.address || 'Unknown';
    const fromEmail = sender?.address || '';

    return {
      id: m.id,
      threadId: m.id,
      provider: 'microsoft',
      from: { name: fromName, email: fromEmail },
      to: (m.toRecipients || []).map((r: any) => ({ email: r.emailAddress?.address || '' })),
      subject: m.subject || '(No Subject)',
      text: m.bodyPreview || m.body?.content || '',
      html: m.body?.contentType === 'html' ? m.body.content : undefined,
      timestamp: m.receivedDateTime || new Date().toISOString(),
      attachments: m.hasAttachments ? ['attachment'] : [],
    };
  });
}
