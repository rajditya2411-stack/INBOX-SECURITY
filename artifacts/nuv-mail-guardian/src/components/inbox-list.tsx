import { CheckCircle2, Circle } from 'lucide-react';
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

export function InboxList({ messages, analyses, selectedId, onSelect }: InboxListProps) {
  return (
    <section className="panel inbox-panel overflow-hidden border border-white/10 bg-[#12161f] rounded-2xl" aria-labelledby="heading-inbox-list">
      <div className="border-b border-white/10 px-5 py-4 flex items-center justify-between">
        <h2 className="text-base font-extrabold text-white" data-testid="heading-inbox-list">Inbox</h2>
        <span className="text-xs font-bold font-mono text-[#8899ac]" data-testid="text-message-count">{messages.length}</span>
      </div>

      <div className="divide-y divide-white/5">
        {messages.length > 0 ? messages.map((message) => {
          const analysis = analyses[message.id];
          const isSelected = selectedId === message.id;
          const isExternal = analysis?.signals.includes('externalSender');
          const isPhishing = analysis?.signals.includes('suspiciousLink') || analysis?.signals.includes('credentialRequest');

          return (
            <button
              type="button"
              key={message.id}
              className={`w-full text-left p-4 transition-all duration-150 ${isSelected ? 'bg-white/10 border-l-4 border-amber-500' : 'hover:bg-white/5'}`}
              onClick={() => onSelect(message)}
              data-testid={`button-message-${message.id}`}
            >
              <div className="flex items-start gap-3">
                {/* Radio Select Icon */}
                <div className="mt-1 text-[#64748b]">
                  {isSelected ? (
                    <CheckCircle2 size={16} className="text-amber-400 fill-amber-400/20" />
                  ) : (
                    <Circle size={16} />
                  )}
                </div>

                {/* Sender Avatar */}
                <div className="h-9 w-9 shrink-0 rounded-full border border-white/10 bg-white/10 grid place-items-center text-xs font-bold text-white">
                  {initials(message.senderName)}
                </div>

                {/* Message Meta & Threat Badges */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-extrabold text-white">{message.senderName}</span>
                    <span className="shrink-0 font-mono text-[0.68rem] text-[#64748b]">{message.time}</span>
                  </div>

                  <div className="mt-0.5 truncate text-xs font-medium text-[#cbd5e1]">{message.subject}</div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {analysis?.flagged ? (
                      isPhishing ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-0.5 text-[0.65rem] font-bold text-red-400 border border-red-500/20">
                          🚫 Blocked Phishing
                        </span>
                      ) : isExternal ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[0.65rem] font-bold text-amber-400 border border-amber-500/20">
                          [Unverified Domain]
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-0.5 text-[0.65rem] font-bold text-red-400 border border-red-500/20">
                          ⚠️ Suspicious Link detected
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-400 border border-emerald-500/20">
                        ✓ Secure
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        }) : (
          <div className="p-8 text-center text-xs text-[#64748b]">No messages in inbox</div>
        )}
      </div>
    </section>
  );
}