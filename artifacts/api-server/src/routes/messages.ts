import { Router } from 'express';
import { fetchGmailMessages, fetchGmailFolders } from '../lib/providers/gmail';
import { fetchMicrosoftMessages, fetchMicrosoftFolders } from '../lib/providers/microsoft';
import { fetchImapMessages, fetchImapFolders } from '../lib/providers/imap';
import { listAccounts } from '../lib/providers/account-store';

const router = Router();

router.get('/messages', async (req, res) => {
  try {
    const provider = (req.query.provider as string) || 'demo';
    const folderId = (req.query.folderId as string) || 'inbox';
    const limit = Number(req.query.limit) || 20;

    const accounts = await listAccounts();
    const activeAccount = accounts.find((a) => a.provider === provider);

    if (!activeAccount) {
      return res.status(404).json({
        error: `No connected account found for provider "${provider}". Please connect your account in Settings.`,
        code: 'ACCOUNT_NOT_CONNECTED',
      });
    }

    if (provider === 'gmail') {
      const messages = await fetchGmailMessages(activeAccount.id, folderId, limit);
      return res.json({ provider: 'gmail', accountId: activeAccount.id, messages });
    }

    if (provider === 'microsoft') {
      const messages = await fetchMicrosoftMessages(activeAccount.id, folderId, limit);
      return res.json({ provider: 'microsoft', accountId: activeAccount.id, messages });
    }

    if (provider === 'imap') {
      const messages = await fetchImapMessages(activeAccount.id, folderId, limit);
      return res.json({ provider: 'imap', accountId: activeAccount.id, messages });
    }

    return res.status(400).json({ error: `Unsupported provider "${provider}"` });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || String(err) });
  }
});

router.get('/folders', async (req, res) => {
  try {
    const provider = (req.query.provider as string) || 'demo';
    const accounts = await listAccounts();
    const activeAccount = accounts.find((a) => a.provider === provider);

    if (!activeAccount) {
      return res.status(404).json({ error: `No active account for provider ${provider}` });
    }

    if (provider === 'gmail') {
      const folders = await fetchGmailFolders(activeAccount.id);
      return res.json({ folders });
    }

    if (provider === 'microsoft') {
      const folders = await fetchMicrosoftFolders(activeAccount.id);
      return res.json({ folders });
    }

    if (provider === 'imap') {
      const folders = await fetchImapFolders(activeAccount.id);
      return res.json({ folders });
    }

    return res.status(400).json({ error: `Unsupported provider "${provider}"` });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || String(err) });
  }
});

export default router;
