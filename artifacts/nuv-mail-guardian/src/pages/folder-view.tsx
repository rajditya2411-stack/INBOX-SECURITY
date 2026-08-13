import { useRef, useState } from 'react';
import { InboxList } from '@/components/inbox-list';
import { MessageDetail } from '@/components/message-detail';
import { ExplanationModal } from '@/components/explanation-modal';
import { useMailbox } from '@/hooks/use-mailbox';
import { useSecuritySettings } from '@/hooks/use-security-settings';
import type { MailMessage } from '@/data/messages';

type FolderViewProps = {
  folder: 'sent' | 'drafts' | 'spam' | 'trash';
  title: string;
  description: string;
  onReply?: (message: MailMessage) => void;
};

export function FolderView({ folder, title, description, onReply }: FolderViewProps) {
  const { messages, analyses } = useMailbox(folder);
  const { settings, aiApiKey, aiConfigured } = useSecuritySettings();
  const [selected, setSelected] = useState<MailMessage | null>(null);
  const [warningDismissed, setWarningDismissed] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const [search, setSearch] = useState('');
  const whyTriggerRef = useRef<HTMLButtonElement>(null);

  const filteredMessages = messages.filter((message) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      `${message.senderName} ${message.senderEmail} ${message.subject} ${message.preview} ${message.body.join(' ')}`
        .toLowerCase()
        .includes(query)
    );
  });

  const selectMessage = (message: MailMessage) => {
    setSelected(message);
    setWarningDismissed(false);
    setWhyOpen(false);
  };

  return (
    <>
      <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="eyebrow">Demo Mode</div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">{title}</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-[#71869c]">{description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-3 text-xs font-medium text-slate-700 dark:text-[#4c6f91]">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-500/10 text-blue-500 font-bold">
            {filteredMessages.length}
          </span>
          <span>
            Message{filteredMessages.length !== 1 ? 's' : ''}<br />
            <strong className="font-mono text-[0.68rem] text-slate-900 dark:text-[#28547d]">in {folder}</strong>
          </span>
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
