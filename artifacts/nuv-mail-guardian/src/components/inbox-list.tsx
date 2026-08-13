import { Search, ShieldCheck } from 'lucide-react';
import { MailMessage, initials } from '@/data/messages';
import type { SecurityAnalysis } from '@/lib/analyzer';

type InboxListProps = {
  messages: MailMessage[];
  analyses: Record<string, SecurityAnalysis>;
  selectedId: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (message: MailMessage) => void;
};

export function InboxList({ messages, analyses, selectedId, search, onSearchChange, onSelect }: InboxListProps) {
  return (
    <section className="panel inbox-panel overflow-hidden" aria-labelledby="heading-inbox-list">
      <div className="border-b border-[#e8eef4] px-4 py-4 sm:px-5">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <div className="eyebrow">Inbox</div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-[#1f4165]" data-testid="heading-inbox-list">Your messages</h2>
          </div>
          <span className="rounded-full bg-[#edf6ff] px-2.5 py-1 text-xs font-bold text-[#3873a8]" data-testid="text-message-count">{messages.length} messages</span>
        </div>
        <label className="search-field" htmlFor="message-search">
          <Search size={16} />
           <input id="message-search" type="search" placeholder="Search sender, subject, or message" value={search} onChange={(event) => onSearchChange(event.target.value)} data-testid="input-message-search" />
        </label>
         <span className="sr-only" role="status" aria-live="polite">{messages.length} messages shown</span>
      </div>
      <div>
        {messages.length > 0 ? messages.map((message) => {
           const analysis = analyses[message.id];
          return (
            <button
              type="button"
              key={message.id}
              className="message-row"
              data-selected={selectedId === message.id}
              onClick={() => onSelect(message)}
              data-testid={`button-message-${message.id}`}
            >
              <div className="flex items-start gap-3">
                <span className="sender-avatar">{initials(message.senderName)}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-bold text-[#f0f4f8]" data-testid={`text-sender-${message.id}`}>{message.senderName}</span>
                    </span>
                    <span className="shrink-0 text-[0.7rem] font-medium text-[#71869c]">{message.time}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-xs font-semibold text-[#cbd5e1]">{message.subject}</span>
                  <span className="mt-1 block truncate text-xs leading-5 text-[#8899ac]">{message.preview}</span>
                  <span className="mt-2.5 flex items-center gap-2">
                    {analysis?.flagged ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ef4444]/15 px-2.5 py-0.5 text-[0.68rem] font-bold text-[#fca5a5] border border-[#ef4444]/30" data-testid={`status-suspicious-${message.id}`}>
                        <span className="suspicious-dot" aria-hidden="true" />
                        {analysis.signals.includes('externalSender') ? '[Unverified Domain]' : 'Suspicious Link detected'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/15 px-2.5 py-0.5 text-[0.68rem] font-bold text-[#6ee7b7] border border-[#10b981]/30">
                        ✓ Secure
                      </span>
                    )}
                  </span>
                </span>
              </div>
            </button>
          );
        }) : (
          <div className="px-6 py-12 text-center">
            <div className="empty-illustration mx-auto"><Search size={24} /></div>
            <h3 className="mt-4 font-bold text-[#2a4d70]">No messages found</h3>
            <p className="mt-1 text-sm text-[#7c90a5]">Try a different sender or subject.</p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-[#e8eef4] bg-[#fbfdff] px-5 py-3 text-[0.7rem] text-[#7890a8]">
        <ShieldCheck size={14} className="text-[#4c8b77]" />
          <span>Rule-based signals help you pause and verify unusual requests</span>
      </div>
    </section>
  );
}