import { DemoEmailProvider } from './demo';
import { GmailProviderStub, MicrosoftProviderStub, ImapProviderStub } from './stubs';
import type { EmailProvider } from './types';

/*
 Simple registry. In future this can be enhanced to load configured providers,
 handle persistence, or prefer a configured live provider.
*/
const providers: Record<string, EmailProvider> = {
  demo: new DemoEmailProvider(),
  gmail: GmailProviderStub,
  microsoft: MicrosoftProviderStub,
  imap: ImapProviderStub,
};

export function registerProvider(id: string, provider: EmailProvider) {
  providers[id] = provider;
}

export function getProvider(id: string): EmailProvider | undefined {
  return providers[id];
}

export function getDefaultProvider(): EmailProvider {
  // default to demo
  return providers['demo'];
}

export function listProviderIds(): string[] {
  return Object.keys(providers);
}
