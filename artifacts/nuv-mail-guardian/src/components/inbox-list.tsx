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
    <section className="panel inbox-panel overflow-hidden border border-border bg-card rounded-2xl" aria-labelledby="heading-inbox-list">
      <div className="border-b border-border px-5 py-4 flex items-center justify-between">
        <h2 className="text-base font-extrabold text-foreground" data-testid="heading-inbox-list">Inbox</h2>
        <span className="text-xs font-bold font-mono text-muted-foreground" data-testid="text-message-count">{messages.length}</span>
      </div>

      <div className="divide-y divide-border">
        {messages.length > 0 ? messages.map((message) => {
          const analysis = analyses[message.id];
          const isSelected = selectedId === message.id;
          const isExternal = analysis?.signals.includes('externalSender');
          const isPhishing = analysis?.signals.includes('suspiciousLink') || analysis?.signals.includes('credentialRequest');

          return (
            <button
              type="button"
              key={message.id}
              className={`w-full text-left p-4 transition-all duration-150 ${isSelected ? 'bg-amber-500/10 dark:bg-white/10 border-l-4 border-amber-500' : 'hover:bg-muted/60'}`}
              onClick={() => onSelect(message)}
              data-testid={`button-message-${message.id}`}
            >
              <div className="flex items-start gap-3">
                {/* Radio Select Icon */}
                <div className="mt-1 text-muted-foreground">
                  {isSelected ? (
                    <CheckCircle2 size={16} className="text-amber-500 fill-amber-500/20" />
                  ) : (
                    <Circle size={16} />
                  )}
                </div>

                {/* Sender Avatar */}
                <div className="h-9 w-9 shrink-0 rounded-full border border-border bg-muted grid place-items-center text-xs font-bold text-foreground">
                  {initials(message.senderName)}
                </div>

                {/* Message Meta & Threat Badges */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-extrabold text-foreground">{message.senderName}</span>
                    <span className="shrink-0 font-mono text-[0.68rem] text-muted-foreground">{message.time}</span>
                  </div>

                  <div className="mt-0.5 truncate text-xs font-medium text-muted-foreground">{message.subject}</div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {analysis?.flagged ? (
                      isPhishing ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-0.5 text-[0.65rem] font-bold text-red-600 dark:text-red-400 border border-red-500/20">
                          🚫 Blocked Phishing
                        </span>
                      ) : isExternal ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[0.65rem] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          [Unverified Domain]
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-0.5 text-[0.65rem] font-bold text-red-600 dark:text-red-400 border border-red-500/20">
                          ⚠️ Suspicious Link detected
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        ✓ Secure
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        }) : (
          <div className="p-8 text-center text-xs text-muted-foreground">No messages in inbox</div>
        )}
      </div>
    </section>
  );
}