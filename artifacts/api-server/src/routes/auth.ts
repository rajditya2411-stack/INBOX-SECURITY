import { Router } from 'express';
import { getGoogleAuthUrl, handleGoogleCallback } from '../lib/providers/gmail';
import { getMicrosoftAuthUrl, handleMicrosoftCallback } from '../lib/providers/microsoft';
import { connectImapAccount } from '../lib/providers/imap';
import { listAccounts, deleteAccount, getAccount } from '../lib/providers/account-store';

const router = Router();

// Gmail OAuth routes
router.get('/auth/gmail/url', (_req, res) => {
  res.json(getGoogleAuthUrl());
});

router.get('/auth/gmail/callback', async (req, res) => {
  try {
    const code = req.query.code as string;
    if (!code) {
      res.status(400).send('Missing authorization code');
      return;
    }
    const account = await handleGoogleCallback(code);
    res.redirect(`/settings?connected=gmail&email=${encodeURIComponent(account.emailAddress)}`);
  } catch (err: any) {
    res.status(500).send(`Gmail authentication error: ${err?.message || err}`);
  }
});

// Microsoft / Outlook OAuth routes
router.get('/auth/microsoft/url', (_req, res) => {
  res.json(getMicrosoftAuthUrl());
});

router.get('/auth/microsoft/callback', async (req, res) => {
  try {
    const code = req.query.code as string;
    if (!code) {
      res.status(400).send('Missing authorization code');
      return;
    }
    const account = await handleMicrosoftCallback(code);
    res.redirect(`/settings?connected=microsoft&email=${encodeURIComponent(account.emailAddress)}`);
  } catch (err: any) {
    res.status(500).send(`Microsoft authentication error: ${err?.message || err}`);
  }
});

// IMAP Connection route
router.post('/auth/imap/connect', async (req, res) => {
  try {
    const { host, port, secure, user, password } = req.body || {};
    const account = await connectImapAccount({
      host,
      port: Number(port) || 993,
      secure: Boolean(secure ?? true),
      user,
      password,
    });
    res.json({ success: true, account });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err?.message || String(err) });
  }
});

// Accounts listing & management
router.get('/accounts', async (_req, res) => {
  const accounts = await listAccounts();
  res.json({ accounts });
});

router.post('/accounts/:id/disconnect', async (req, res) => {
  const accountId = req.params.id;
  const deleted = await deleteAccount(accountId);
  res.json({ success: deleted });
});

export default router;
