import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { InboxList } from '@/components/inbox-list';
import { MailLayout } from '@/components/mail-layout';
import { MessageDetail } from '@/components/message-detail';
import { ExplanationModal } from '@/components/explanation-modal';
import { ComposeModal } from '@/components/compose-modal';
import type { MailMessage } from '@/data/messages';
import { analyzeMessages } from '@/lib/analyzer';
import { SecuritySettingsProvider, useSecuritySettings } from '@/hooks/use-security-settings';
import { useMailbox } from '@/hooks/use-mailbox';
import { DashboardPage } from '@/pages/dashboard';
import { SettingsPage } from '@/pages/settings';
import { FolderView } from '@/pages/folder-view';
import NotFound from '@/pages/not-found';
import type { CreateMessagePayload } from '@/lib/providers';

const queryClient = new QueryClient();

type InboxPageProps = {
  onReply: (message: MailMessage) => void;
};

function InboxPage({ onReply }: InboxPageProps) {
  const { settings, aiApiKey, aiConfigured } = useSecuritySettings();
  const { messages: inboxMessages, analyses } = useMailbox('inbox');
  const [selected, setSelected] = useState<MailMessage | null>(null);
  const [warningDismissed, setWarningDismissed] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const [search, setSearch] = useState('');
  const whyTriggerRef = useRef<HTMLButtonElement>(null);

  const filteredMessages = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return inboxMessages;
    return inboxMessages.filter((message) => (
      `${message.senderName} ${message.senderEmail} ${message.subject} ${message.preview} ${message.body.join(' ')}`
        .toLowerCase()
        .includes(query)
    ));
  }, [search, inboxMessages]);

  const selectMessage = (message: MailMessage) => {
    setSelected(message);
    setWarningDismissed(false);
    setWhyOpen(false);
  };

  return (
    <>
      <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="eyebrow">{settings.emailProvider === 'demo' ? 'Demo Mode' : 'Inbox'}</div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1f4165] sm:text-4xl" data-testid="heading-inbox">Inbox, with a clearer signal.</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#71869c]">Review sample mail with confidence. Security Guard combines trusted domains with transparent rule-based signals.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-xl border border-[#dbe8f3] bg-[#f5faff] px-3.5 py-3 text-xs font-medium text-[#4c6f91]" data-testid="status-inbox-rule">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#deefff] text-[#3474ae]">01</span>
          <span>Rule-based<br /><strong className="font-mono text-[0.68rem] text-[#28547d]">signals active</strong></span>
        </div>
      </div>
      <div className="mail-grid" data-mobile-detail={selected ? 'true' : 'false'}>
         <InboxList
           messages={filteredMessages}
           analyses={analyses}
           selectedId={selected?.id ?? null}
           search={search}
           onSearchChange={setSearch}
           onSelect={selectMessage}
         />
         <MessageDetail
           message={selected}
           analysis={selected ? analyses[selected.id] : undefined}
           trustedDomains={settings.trustedDomains}
           aiApiKey={aiApiKey}
           aiConfigured={aiConfigured}
           aiProvider={settings.aiProvider}
           aiModel={settings.aiModel}
           warningDismissed={warningDismissed}
           whyButtonRef={whyTriggerRef}
           onSeeWhy={() => setWhyOpen(true)}
           onContinueReading={() => setWarningDismissed(true)}
           onBack={() => setSelected(null)}
           onReply={onReply}
         />
      </div>
       {whyOpen && selected && (
         <ExplanationModal
           message={selected}
           analysis={analyses[selected.id]}
           trustedDomains={settings.trustedDomains}
           returnFocusRef={whyTriggerRef}
           onClose={() => setWhyOpen(false)}
         />
       )}
    </>
  );
}

function RoutedApp() {
  const { settings } = useSecuritySettings();
  const { messages: inboxMessages, sendMessage, saveDraft } = useMailbox('inbox');
  const analyses = useMemo(() => analyzeMessages(inboxMessages, settings.trustedDomains), [inboxMessages, settings.trustedDomains]);

  const [composeOpen, setComposeOpen] = useState(false);
  const [composeDefaults, setComposeDefaults] = useState<{ to: string; subject: string; body: string }>({ to: '', subject: '', body: '' });

  const handleOpenCompose = (to = '', subject = '', body = '') => {
    setComposeDefaults({ to, subject, body });
    setComposeOpen(true);
  };

  const handleReply = (message: MailMessage) => {
    const subject = message.subject.startsWith('Re:') ? message.subject : `Re: ${message.subject}`;
    const body = `\n\n--- Original Message from ${message.senderName} (${message.senderEmail}) ---\n${message.body.join('\n')}`;
    handleOpenCompose(message.senderEmail, subject, body);
  };

  const handleSendPayload = async (payload: CreateMessagePayload) => {
    await sendMessage(payload);
  };

  const handleSaveDraftPayload = async (payload: CreateMessagePayload) => {
    await saveDraft(payload);
  };

  return (
    <MailLayout inboxCount={inboxMessages.length} onCompose={() => handleOpenCompose()}>
      <Switch>
        <Route path="/"><InboxPage onReply={handleReply} /></Route>
        <Route path="/dashboard"><DashboardPage messages={inboxMessages} analyses={analyses} /></Route>
        <Route path="/sent"><FolderView folder="sent" title="Sent" description="Review messages you've sent from this browser." onReply={handleReply} /></Route>
        <Route path="/drafts"><FolderView folder="drafts" title="Drafts" description="Unfinished messages in your draft folder." onReply={handleReply} /></Route>
        <Route path="/spam"><FolderView folder="spam" title="Spam" description="Messages flagged as suspicious or spam." onReply={handleReply} /></Route>
        <Route path="/trash"><FolderView folder="trash" title="Trash" description="Deleted messages in your trash folder." onReply={handleReply} /></Route>
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>

      {composeOpen && (
        <ComposeModal
          initialTo={composeDefaults.to}
          initialSubject={composeDefaults.subject}
          initialBody={composeDefaults.body}
          onSend={handleSendPayload}
          onSaveDraft={handleSaveDraftPayload}
          onClose={() => setComposeOpen(false)}
        />
      )}
    </MailLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <SecuritySettingsProvider>
          <RoutedApp />
        </SecuritySettingsProvider>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
