import { useEffect, useState } from 'react';
import { Check, KeyRound, LockKeyhole, Plus, ShieldCheck, Trash2, Link as LinkIcon, Unlink, Server, AlertCircle, Moon, Sun, Loader2, Zap } from 'lucide-react';
import { useSecuritySettings, type AIProvider, type EmailProvider } from '@/hooks/use-security-settings';
import { ImapConfigModal } from '@/components/imap-config-modal';
import { getLLMProvider } from '@/lib/llm/stubs';

const emailProviders: Array<{ value: EmailProvider; label: string }> = [
  { value: 'demo', label: 'Demo Mode' },
  { value: 'gmail', label: 'Gmail' },
  { value: 'outlook', label: 'Microsoft Outlook' },
  { value: 'imap', label: 'Generic IMAP' },
];

const aiProviders: Array<{ value: AIProvider; label: string }> = [
  { value: 'none', label: 'None (Rule-Based Only)' },
  { value: 'openai', label: 'OpenAI (GPT-4o / GPT-4o-mini)' },
  { value: 'gemini', label: 'Google Gemini (Gemini 1.5 Flash)' },
  { value: 'anthropic', label: 'Anthropic / Claude (Claude 3.5 Haiku)' },
  { value: 'grok', label: 'xAI / Grok (Grok Beta)' },
];

export function SettingsPage() {
  const { settings, aiApiKey, aiConfigured, setAiApiKey, updateSettings, addTrustedDomain, removeTrustedDomain } = useSecuritySettings();
  const [domainInput, setDomainInput] = useState('');
  const [domainError, setDomainError] = useState('');
  const [saved, setSaved] = useState(false);
  const [testingAi, setTestingAi] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

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

  const saveAI = () => {
    setSaved(true);
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    if (settings.aiProvider === 'none') return;
    setTestingAi(true);
    setTestResult(null);
    try {
      const provider = getLLMProvider(settings.aiProvider);
      const res = await provider.testConnection(aiApiKey, settings.aiModel);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || 'Connection test failed.' });
    } finally {
      setTestingAi(false);
    }
  };

  const getModelPlaceholder = (provider: AIProvider) => {
    switch (provider) {
      case 'openai': return 'gpt-4o-mini (default)';
      case 'gemini': return 'gemini-1.5-flash (default)';
      case 'anthropic': return 'claude-3-5-haiku-20241022 (default)';
      case 'grok': return 'grok-beta (default)';
      default: return 'Optional model name';
    }
  };


  const activeProviderValue = settings.emailProvider === 'outlook' ? 'microsoft' : settings.emailProvider;
  const connectedAccount = accounts.find((a) => a.provider === activeProviderValue);

  return (
    <div className="space-y-7">
      <div>
        <div className="eyebrow">Configuration</div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white" data-testid="heading-settings">Settings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-[#71869c]">Configure how Security Guard reads email, manages real account connections, and evaluates security signals.</p>
      </div>

      {connectMessage && (
        <div className="rounded-xl border border-[#b2e2d0] bg-[#eefaf4] px-5 py-3 text-sm font-semibold text-[#227255] flex items-center justify-between">
          <span>{connectMessage}</span>
          <button type="button" className="text-xs text-[#227255] underline" onClick={() => setConnectMessage('')}>Dismiss</button>
        </div>
      )}

      <section className="panel overflow-hidden" data-testid="section-theme-settings">
        <div className="border-b border-border px-5 py-5 sm:px-7">
          <div className="eyebrow">Appearance</div>
          <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">Theme Mode</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-[#7b8fa4]">Switch between Dark Mode (Option 1 Minimalist) and Light Mode.</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-7">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600/10 text-blue-500">
              {settings.theme === 'dark' ? <Moon size={20} /> : <Sun size={20} className="text-amber-500" />}
            </span>
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">Active Theme: {settings.theme === 'dark' ? 'Dark Mode (Minimalist Option 1)' : 'Light Mode'}</div>
              <div className="text-xs text-slate-500 dark:text-[#7b8fa4]">Personalize your visual experience. Saved in local settings.</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-input p-1.5">
            <button
              type="button"
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${settings.theme === 'dark' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-slate-600 hover:text-slate-900 dark:text-[#5a6f88]'}`}
              onClick={() => updateSettings({ theme: 'dark' })}
              data-testid="button-theme-dark"
            >
              <Moon size={14} /> Dark
            </button>
            <button
              type="button"
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${settings.theme === 'light' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-slate-600 hover:text-slate-900 dark:text-[#5a6f88]'}`}
              onClick={() => updateSettings({ theme: 'light' })}
              data-testid="button-theme-light"
            >
              <Sun size={14} /> Light
            </button>
          </div>
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-border px-5 py-5 sm:px-7">
          <div className="eyebrow">General</div>
          <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">Email Provider & Account Connection</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-[#7b8fa4]">Select an active provider or connect real email accounts via OAuth 2.0 / IMAP.</p>
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
            <div className="rounded-xl border border-border bg-slate-50 dark:bg-white/5 p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-600 text-white font-bold text-sm uppercase">{connectedAccount.provider.slice(0, 2)}</span>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">{connectedAccount.emailAddress}</div>
                  <div className="text-xs text-slate-500 dark:text-[#527395] flex items-center gap-1.5 mt-0.5">
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
            <div className="rounded-xl border border-[#ebdbe2] bg-[#fdf7f9] dark:bg-red-950/20 dark:border-red-900/40 p-4 space-y-3">
              <div className="flex items-start gap-2.5 text-xs text-[#8a4a58] dark:text-red-300 font-medium">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>No connected account found for <strong>{settings.emailProvider.toUpperCase()}</strong>. Connect your account using secure OAuth or IMAP parameters below.</span>
              </div>
            </div>
          )}

          <div className="border-t border-border pt-5">
            <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-[#7891a8] mb-3">Available Connection Options</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold text-slate-900 dark:text-white shadow-sm transition-all hover:bg-muted"
                onClick={handleConnectGmail}
                data-testid="button-connect-gmail"
              >
                <LinkIcon size={15} className="text-[#ea4335]" />
                Connect Gmail
              </button>

              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold text-slate-900 dark:text-white shadow-sm transition-all hover:bg-muted"
                onClick={handleConnectMicrosoft}
                data-testid="button-connect-microsoft"
              >
                <LinkIcon size={15} className="text-[#0078d4]" />
                Connect Outlook
              </button>

              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold text-slate-900 dark:text-white shadow-sm transition-all hover:bg-muted"
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

      <section className="panel overflow-hidden" data-testid="section-ai-settings">
        <div className="border-b border-border px-5 py-5 sm:px-7">
          <div className="eyebrow">Optional AI Assistant</div>
          <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">AI Provider & Model Integration</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-[#7b8fa4]">Connect real AI models (OpenAI, Gemini, Claude, Grok) for threat explanations. Rule-based analysis always runs 100% locally first.</p>
        </div>
        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-7">
          <label className="field-group">
            <span className="field-label">Provider</span>
            <select
              className="settings-input"
              value={settings.aiProvider}
              onChange={(event) => {
                updateSettings({ aiProvider: event.target.value as AIProvider });
                setTestResult(null);
                setSaved(false);
              }}
              data-testid="select-ai-provider"
            >
              {aiProviders.map((provider) => <option key={provider.value} value={provider.value}>{provider.label}</option>)}
            </select>
          </label>

          <label className="field-group">
            <span className="field-label">Model Name</span>
            <input
              className="settings-input"
              value={settings.aiModel}
              onChange={(event) => {
                updateSettings({ aiModel: event.target.value });
                setTestResult(null);
                setSaved(false);
              }}
              placeholder={getModelPlaceholder(settings.aiProvider)}
              disabled={settings.aiProvider === 'none'}
              data-testid="input-ai-model"
            />
          </label>

          <label className="field-group sm:col-span-2">
            <span className="field-label">API Key (Session / Server Env Fallback)</span>
            <span className="relative">
              <KeyRound size={15} className="field-icon" />
              <input
                className="settings-input pl-9"
                type="password"
                value={aiApiKey}
                onChange={(event) => { setAiApiKey(event.target.value); setSaved(false); setTestResult(null); }}
                placeholder={settings.aiProvider === 'none' ? 'Select an AI provider above to configure' : 'Enter API key (or leave empty to check server env variables)'}
                disabled={settings.aiProvider === 'none'}
                data-testid="input-ai-key"
              />
            </span>
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2 pt-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="primary-button"
                onClick={saveAI}
                disabled={settings.aiProvider === 'none'}
                data-testid="button-save-ai"
              >
                <KeyRound size={14} /> Save Configuration
              </button>

              <button
                type="button"
                className="outline-button flex items-center gap-2"
                onClick={handleTestConnection}
                disabled={settings.aiProvider === 'none' || testingAi}
                data-testid="button-test-ai"
              >
                {testingAi ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} className="text-amber-500" />}
                Test Connection
              </button>
            </div>

            {saved && <span className="text-xs font-semibold text-[#4c8b77]">Configuration active for this browser session.</span>}
          </div>

          {testResult && (
            <div className={`sm:col-span-2 rounded-xl border p-4 text-xs font-medium flex items-center gap-3.5 ${testResult.success ? 'border-[#b2e2d0] bg-[#eefaf4] dark:bg-emerald-950/30 text-[#227255] dark:text-emerald-300' : 'border-[#f2c7cb] bg-[#fdf2f3] dark:bg-red-950/30 text-[#a64b54] dark:text-red-300'}`} data-testid="badge-ai-test-result">
              {testResult.success ? <Check size={18} className="shrink-0 text-[#227255] dark:text-emerald-300" /> : <AlertCircle size={18} className="shrink-0 text-[#a64b54] dark:text-red-300" />}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>
        <div className="mx-5 mb-5 rounded-lg bg-slate-100 dark:bg-white/5 border border-border px-4 py-3 text-xs leading-5 text-slate-600 dark:text-[#647d96] sm:mx-7">
          Security Guard passes deterministic security engine findings to the AI model to generate human-readable explanations. If an API key is missing or an AI provider fails, rule-based security remains 100% operational.
        </div>
      </section>


      <section className="panel overflow-hidden">
        <div className="border-b border-border px-5 py-5 sm:px-7">
          <div className="eyebrow">Security Rules</div>
          <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">Trusted Domains</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-[#7b8fa4]">A matching domain is not flagged solely for being external. Other signals are still evaluated.</p>
        </div>
        <div className="space-y-4 px-5 py-5 sm:px-7">
          <div className="flex flex-wrap gap-2">
            {settings.trustedDomains.map((domain) => (
              <div key={domain} className="trusted-domain flex items-center gap-2 px-3 py-2" data-testid={`trusted-domain-${domain}`}><span className="font-mono text-sm font-bold text-slate-900 dark:text-[#28547d]">{domain}</span><button type="button" className="rounded p-1 text-slate-400 hover:bg-red-500/10 hover:text-red-500" onClick={() => removeTrustedDomain(domain)} aria-label={`Remove ${domain}`}><Trash2 size={14} /></button></div>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row"><input className="settings-input" value={domainInput} onChange={(event) => setDomainInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') addDomain(); }} placeholder="Add a trusted domain, e.g. partner.org" aria-describedby="domain-error" /><button type="button" className="outline-button shrink-0" onClick={addDomain}><Plus size={14} />Add domain</button></div>
          {domainError && <p id="domain-error" className="text-xs font-semibold text-red-500" role="alert">{domainError}</p>}
          <div className="settings-note">Domains are stored locally in this browser. Security Guard does not contact or verify domains.</div>
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-border px-5 py-5 sm:px-7"><div className="eyebrow">Privacy</div><h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">Your data stays yours</h2></div>
        <div className="grid gap-3 px-5 py-5 text-sm leading-6 text-slate-600 dark:text-[#647d96] sm:grid-cols-2 sm:px-7"><p>Security Guard is open source. Rule-based analysis works without AI or a server.</p><p>Users provide their own optional AI API key. Credentials should never be hard-coded.</p><p>Real email providers will require user authorization, such as OAuth.</p><p>This Version 2 foundation does not send demo messages anywhere.</p></div>
      </section>

      <section className="panel max-w-3xl overflow-hidden">
        <div className="border-b border-border px-5 py-5 sm:px-7"><div className="eyebrow">About</div><h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">Security Guard</h2><p className="mt-1 text-sm text-slate-600 dark:text-[#7b8fa4]">Open-source email security assistant · Version 0.2</p></div>
        <div className="grid gap-2 px-5 py-5 text-sm text-slate-600 dark:text-[#647d96] sm:grid-cols-2 sm:px-7"><span>✓ Rule-based analysis</span><span>✓ Suspicious email detection</span><span>✓ Trusted domains</span><span>✓ Optional AI analysis</span><span>✓ Bring Your Own API Key</span><span>✓ Provider-agnostic design</span></div>
      </section>
    </div>
  );
}