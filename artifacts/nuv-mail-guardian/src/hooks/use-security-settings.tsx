import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { normalizeDomain } from '@/lib/analyzer';

export type EmailProvider = 'demo' | 'gmail' | 'outlook' | 'imap';
export type AIProvider = 'none' | 'openai' | 'anthropic' | 'gemini' | 'grok' | 'compatible';
export type ThemeMode = 'dark' | 'light';

export type SecuritySettings = {
  emailProvider: EmailProvider;
  aiProvider: AIProvider;
  aiModel: string;
  trustedDomains: string[];
  theme: ThemeMode;
};

const defaults: SecuritySettings = {
  emailProvider: 'demo',
  aiProvider: 'none',
  aiModel: '',
  trustedDomains: ['company.com', 'trustedbank.example', 'community.org', 'microsoft.com'],
  theme: 'dark',
};

const storageKey = 'security-guard-settings-v2';

type SecuritySettingsContextValue = {
  settings: SecuritySettings;
  aiApiKey: string;
  aiConfigured: boolean;
  setAiApiKey: (value: string) => void;
  updateSettings: (patch: Partial<SecuritySettings>) => void;
  addTrustedDomain: (domain: string) => boolean;
  removeTrustedDomain: (domain: string) => void;
  toggleTheme: () => void;
};

const SecuritySettingsContext = createContext<SecuritySettingsContextValue | null>(null);

function loadSettings(): SecuritySettings {
  if (typeof window === 'undefined') return defaults;
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return defaults;
    const parsed = JSON.parse(stored) as Partial<SecuritySettings>;
    return {
      ...defaults,
      ...parsed,
      theme: parsed.theme === 'light' ? 'light' : 'dark',
      trustedDomains: Array.isArray(parsed.trustedDomains) && parsed.trustedDomains.length > 0
        ? parsed.trustedDomains.map(normalizeDomain).filter(Boolean)
        : defaults.trustedDomains,
    };
  } catch {
    return defaults;
  }
}

export function SecuritySettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SecuritySettings>(loadSettings);
  const [aiApiKey, setAiApiKey] = useState('');

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(settings));
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  const value = useMemo<SecuritySettingsContextValue>(() => ({
    settings,
    aiApiKey,
    aiConfigured: settings.aiProvider !== 'none' && aiApiKey.trim().length > 0,
    setAiApiKey,
    updateSettings: (patch) => setSettings((current) => ({ ...current, ...patch })),
    addTrustedDomain: (domain) => {
      const normalized = normalizeDomain(domain);
      if (!normalized || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(normalized)) return false;
      let added = false;
      setSettings((current) => {
        if (current.trustedDomains.includes(normalized)) return current;
        added = true;
        return { ...current, trustedDomains: [...current.trustedDomains, normalized] };
      });
      return added;
    },
    removeTrustedDomain: (domain) => setSettings((current) => {
      if (current.trustedDomains.length <= 1) return current;
      return { ...current, trustedDomains: current.trustedDomains.filter((item) => item !== normalizeDomain(domain)) };
    }),
    toggleTheme: () => setSettings((current) => ({ ...current, theme: current.theme === 'dark' ? 'light' : 'dark' })),
  }), [aiApiKey, settings]);

  return <SecuritySettingsContext.Provider value={value}>{children}</SecuritySettingsContext.Provider>;
}

export function useSecuritySettings() {
  const value = useContext(SecuritySettingsContext);
  if (!value) throw new Error('useSecuritySettings must be used within SecuritySettingsProvider');
  return value;
}