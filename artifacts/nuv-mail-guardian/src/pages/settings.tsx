import { useEffect, useState } from 'react';
import { Check, KeyRound, LockKeyhole, Plus, ShieldCheck, Trash2, Link as LinkIcon, Unlink, Server, AlertCircle } from 'lucide-react';
import { useSecuritySettings, type AIProvider, type EmailProvider } from '@/hooks/use-security-settings';
import { ImapConfigModal } from '@/components/imap-config-modal';

const emailProviders: Array<{ value: EmailProvider; label: string }> = [
  { value: 'demo', label: 'Demo Mode' },
  { value: 'gmail', label: 'Gmail' },
  { value: 'outlook', label: 'Microsoft Outlook' },
  { value: 'imap', label: 'Generic IMAP' },
];

const aiProviders: Array<{ value: AIProvider; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic / Claude' },
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'grok', label: 'xAI / Grok' },
  { value: 'compatible', label: 'OpenAI-compatible API' },
];

export function SettingsPage() {
  const { settings, aiApiKey, aiConfigured, setAiApiKey, updateSettings, addTrustedDomain, removeTrustedDomain } = useSecuritySettings();
  const [domainInput, setDomainInput] = useState('');
  const [domainError, setDomainError] = useState('');
  const [saved, setSaved] = useState(false);

  const [accounts, setAccounts] = useState<Array<{ id: string; provider: string; emailAddress: string; status: string }>>([]);
  const [imapModalOpen, setImapModalOpen] = useState(false);
  const [connectMessage, setConnectMessage] = useState('');

  const loadAccounts = async () => {
    try {
      const res = await fetch('/api/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch {
      setAccounts([]);
    }
  };

  useEffect(() => {
    void loadAccounts();

    // Check URL search params for OAuth redirect results
    const params = new URLSearchParams(window.location.search);
    const connectedProvider = params.get('connected');
    const connectedEmail = params.get('email');
    if (connectedProvider && connectedEmail) {
      setConnectMessage(`Successfully connected ${connectedProvider.toUpperCase()} account (${connectedEmail}).`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleConnectGmail = async () => {
    try {
      const res = await fetch('/api/auth/gmail/url');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Google OAuth Client ID is not configured on the server. Please set GOOGLE_CLIENT_ID in .env.');
      }
    } catch {
      alert('Failed to connect to backend server for Google OAuth.');
    }
  };

  const handleConnectMicrosoft = async () => {
    try {
      const res = await fetch('/api/auth/microsoft/url');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Microsoft OAuth Client ID is not configured on the server. Please set MICROSOFT_CLIENT_ID in .env.');
      }
    } catch {
      alert('Failed to connect to backend server for Microsoft OAuth.');
    }
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      await fetch(`/api/accounts/${accountId}/disconnect`, { method: 'POST' });
      await loadAccounts();
    } catch {
      alert('Failed to disconnect account.');
    }
  };

  const addDomain = () => {
    if (!addTrustedDomain(domainInput)) {
      setDomainError('Enter a domain such as company.com.');
      return;
    }
    setDomainInput('');
    setDomainError('');
  };

  const saveAI = () => setSaved(true);

  const activeProviderValue = settings.emailProvider === 'outlook' ? 'microsoft' : settings.emailProvider;
  const connectedAccount = accounts.find((a) => a.provider === activeProviderValue);

  return (
    <div className="space-y-7">
      <div>
        <div className="eyebrow">Configuration</div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1f4165]" data-testid="heading-settings">Settings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#71869c]">Configure how Security Guard reads email, manages real account connections, and evaluates security signals.</p>
      </div>

      {connectMessage && (
        <div className="rounded-xl border border-[#b2e2d0] bg-[#eefaf4] px-5 py-3 text-sm font-semibold text-[#227255] flex items-center justify-between">
          <span>{connectMessage}</span>
          <button type="button" className="text-xs text-[#227255] underline" onClick={() => setConnectMessage('')}>Dismiss</button>
        </div>
      )}

      <section className="panel overflow-hidden">
        <div className="border-b border-[#e8eef4] px-5 py-5 sm:px-7">
          <div className="eyebrow">General</div>
          <h2 className="mt-1 text-xl font-bold text-[#1f4165]">Email Provider & Account Connection</h2>
          <p className="mt-1 text-sm leading-6 text-[#7b8fa4]">Select an active provider or connect real email accounts via OAuth 2.0 / IMAP.</p>
        </div>

        <div className="space-y-6 px-5 py-5 sm:px-7">
          <div>
            <label className="field-label" htmlFor="email-provider">Active Provider</label>
            <select id="email-provider" className="settings-input mt-1" value={settings.emailProvider} onChange={(event) => updateSettings({ emailProvider: event.target.value as EmailProvider })}>
              {emailProviders.map((provider) => <option key={provider.value} value={provider.value}>{provider.label}</option>)}
            </select>
          </div>

          {settings.emailProvider === 'demo' ? (
            <div className="settings-note flex items-start gap-3"><Check size={16} className="mt-0.5 shrink-0 text-[#4c8b77]" /><span>Demo Mode is active. Sample messages are locally generated and clearly labeled.</span></div>
          ) : connectedAccount ? (
            <div className="rounded-xl border border-[#cbe1f5] bg-[#f2f7fd] p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#3474ae] text-white font-bold text-sm uppercase">{connectedAccount.provider.slice(0, 2)}</span>
                <div>
                  <div className="font-bold text-[#1f4165] text-sm">{connectedAccount.emailAddress}</div>
                  <div className="text-xs text-[#527395] flex items-center gap-1.5 mt-0.5">
                    <span className={`h-2 w-2 rounded-full ${connectedAccount.status === 'CONNECTED' ? 'bg-[#3bb582]' : 'bg-[#e05252]'}`} />
                    <span>Status: <strong>{connectedAccount.status}</strong></span>
                  </div>
                </div>
              </div>
              <button type="button" className="ghost-button !text-[#a64b54] hover:!bg-[#fbe9ea]" onClick={() => handleDisconnect(connectedAccount.id)}>
                <Unlink size={14} /> Disconnect
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-[#ebdbe2] bg-[#fdf7f9] p-4 space-y-3">
              <div className="flex items-start gap-2.5 text-xs text-[#8a4a58] font-medium">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>No connected account found for <strong>{settings.emailProvider.toUpperCase()}</strong>. Connect your account using secure OAuth or IMAP parameters below.</span>
              </div>
            </div>
          )}

          <div className="border-t border-[#e8eef4] pt-5">
            <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-[#7891a8] mb-3">Available Connection Options</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-xl border border-[#dbe7f2] bg-white px-4 py-3 text-sm font-bold text-[#234b73] shadow-sm transition-all hover:bg-[#f4f8fc]"
                onClick={handleConnectGmail}
                data-testid="button-connect-gmail"
              >
                <LinkIcon size={15} className="text-[#ea4335]" />
                Connect Gmail
              </button>

              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-xl border border-[#dbe7f2] bg-white px-4 py-3 text-sm font-bold text-[#234b73] shadow-sm transition-all hover:bg-[#f4f8fc]"
                onClick={handleConnectMicrosoft}
                data-testid="button-connect-microsoft"
              >
                <LinkIcon size={15} className="text-[#0078d4]" />
                Connect Outlook
              </button>

              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-xl border border-[#dbe7f2] bg-white px-4 py-3 text-sm font-bold text-[#234b73] shadow-sm transition-all hover:bg-[#f4f8fc]"
                onClick={() => setImapModalOpen(true)}
                data-testid="button-configure-imap"
              >
                <Server size={15} className="text-[#4c6f91]" />
                Configure IMAP
              </button>
            </div>
          </div>
        </div>
      </section>

      {imapModalOpen && (
        <ImapConfigModal
          onClose={() => setImapModalOpen(false)}
          onConnected={(acc) => {
            setConnectMessage(`Connected IMAP account (${acc.emailAddress}).`);
            void loadAccounts();
          }}
        />
      )}

      <section className="panel overflow-hidden">
        <div className="border-b border-[#e8eef4] px-5 py-5 sm:px-7">
          <div className="eyebrow">Optional analysis</div>
          <h2 className="mt-1 text-xl font-bold text-[#1f4165]">AI Provider</h2>
          <p className="mt-1 text-sm leading-6 text-[#7b8fa4]">Bring Your Own API Key. Rule-based analysis always works without AI.</p>
        </div>
        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-7">
          <label className="field-group"><span className="field-label">Provider</span><select className="settings-input" value={settings.aiProvider} onChange={(event) => updateSettings({ aiProvider: event.target.value as AIProvider })}>{aiProviders.map((provider) => <option key={provider.value} value={provider.value}>{provider.label}</option>)}</select></label>
          <label className="field-group"><span className="field-label">Model</span><input className="settings-input" value={settings.aiModel} onChange={(event) => updateSettings({ aiModel: event.target.value })} placeholder="Optional model name" /></label>
          <label className="field-group sm:col-span-2"><span className="field-label">API Key</span><span className="relative"><KeyRound size={15} className="field-icon" /><input className="settings-input pl-9" type="password" value={aiApiKey} onChange={(event) => { setAiApiKey(event.target.value); setSaved(false); }} placeholder={settings.aiProvider === 'none' ? 'Select a provider to configure AI' : 'Enter your key for this browser session'} disabled={settings.aiProvider === 'none'} /></span></label>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2"><button type="button" className="primary-button" onClick={saveAI} disabled={settings.aiProvider !== 'none' && !aiApiKey.trim()}><KeyRound size={14} />Save</button>{saved && <span className="text-xs font-semibold text-[#4c8b77]">Configuration saved for this browser session.</span>}</div>
        </div>
        <div className="mx-5 mb-5 rounded-lg bg-[#f4f8fc] px-4 py-3 text-xs leading-5 text-[#647d96] sm:mx-7">No external AI request is made by this demo. If an AI provider is unavailable, Security Guard keeps rule-based analysis active.</div>
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-[#e8eef4] px-5 py-5 sm:px-7">
          <div className="eyebrow">Security Rules</div>
          <h2 className="mt-1 text-xl font-bold text-[#1f4165]">Trusted Domains</h2>
          <p className="mt-1 text-sm leading-6 text-[#7b8fa4]">A matching domain is not flagged solely for being external. Other signals are still evaluated.</p>
        </div>
        <div className="space-y-4 px-5 py-5 sm:px-7">
          <div className="flex flex-wrap gap-2">
            {settings.trustedDomains.map((domain) => (
              <div key={domain} className="trusted-domain flex items-center gap-2 px-3 py-2" data-testid={`trusted-domain-${domain}`}><span className="font-mono text-sm font-bold text-[#28547d]">{domain}</span><button type="button" className="rounded p-1 text-[#8a7180] hover:bg-[#fbe9ea] hover:text-[#a64b54]" onClick={() => removeTrustedDomain(domain)} aria-label={`Remove ${domain}`}><Trash2 size={14} /></button></div>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row"><input className="settings-input" value={domainInput} onChange={(event) => setDomainInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') addDomain(); }} placeholder="Add a trusted domain, e.g. partner.org" aria-describedby="domain-error" /><button type="button" className="outline-button shrink-0" onClick={addDomain}><Plus size={14} />Add domain</button></div>
          {domainError && <p id="domain-error" className="text-xs font-semibold text-[#a64b54]" role="alert">{domainError}</p>}
          <div className="settings-note">Domains are stored locally in this browser. Security Guard does not contact or verify domains.</div>
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-[#e8eef4] px-5 py-5 sm:px-7"><div className="eyebrow">Privacy</div><h2 className="mt-1 text-xl font-bold text-[#1f4165]">Your data stays yours</h2></div>
        <div className="grid gap-3 px-5 py-5 text-sm leading-6 text-[#647d96] sm:grid-cols-2 sm:px-7"><p>Security Guard is open source. Rule-based analysis works without AI or a server.</p><p>Users provide their own optional AI API key. Credentials should never be hard-coded.</p><p>Real email providers will require user authorization, such as OAuth.</p><p>This Version 2 foundation does not send demo messages anywhere.</p></div>
      </section>

      <section className="panel max-w-3xl overflow-hidden">
        <div className="border-b border-[#e8eef4] px-5 py-5 sm:px-7"><div className="eyebrow">About</div><h2 className="mt-1 text-xl font-bold text-[#1f4165]">Security Guard</h2><p className="mt-1 text-sm text-[#7b8fa4]">Open-source email security assistant · Version 0.2</p></div>
        <div className="grid gap-2 px-5 py-5 text-sm text-[#647d96] sm:grid-cols-2 sm:px-7"><span>✓ Rule-based analysis</span><span>✓ Suspicious email detection</span><span>✓ Trusted domains</span><span>✓ Optional AI analysis</span><span>✓ Bring Your Own API Key</span><span>✓ Provider-agnostic design</span></div>
      </section>
    </div>
  );
}