import { Archive, Flag, Trash2, ShieldAlert } from 'lucide-react';
import { useState, type RefObject } from 'react';
import { MailMessage, initials } from '@/data/messages';
import { WarningBanner } from '@/components/warning-banner';
import type { SecurityAnalysis } from '@/lib/analyzer';
import { createAIProvider, type AIAnalysisResult } from '@/lib/ai-provider';

type MessageDetailProps = {
  message: MailMessage | null;
  analysis?: SecurityAnalysis;
  trustedDomains: string[];
  aiApiKey: string;
  aiConfigured: boolean;
  aiProvider: Parameters<typeof createAIProvider>[0];
  aiModel: string;
  warningDismissed: boolean;
  whyButtonRef: RefObject<HTMLButtonElement | null>;
  onSeeWhy: () => void;
  onContinueReading: () => void;
  onBack: () => void;
  onReply?: (message: MailMessage) => void;
};

export function MessageDetail({ message, analysis, warningDismissed, whyButtonRef, onSeeWhy, onContinueReading, onBack }: MessageDetailProps) {
  if (!message) {
    return (
      <section className="panel detail-card flex flex-col items-center justify-center p-12 text-center border border-border bg-card rounded-2xl min-h-[500px]">
        <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 grid place-items-center text-amber-500 font-bold text-xl">
          🛡️
        </div>
        <h2 className="mt-4 text-base font-bold text-foreground">Select a message to inspect</h2>
        <p className="mt-1 text-xs text-muted-foreground">Mail Guardian security analysis and rule-based verification signals will display here.</p>
      </section>
    );
  }

  const senderDomain = message.senderEmail.split('@')[1] || '';

  return (
    <section className="panel detail-card flex flex-col justify-between border border-border bg-card rounded-2xl overflow-hidden min-h-[600px]" data-testid={`panel-message-detail-${message.id}`}>
      <div>
        {/* Action Toolbar */}
        <div className="flex items-center justify-between border-b border-border px-6 py-3 bg-muted/30">
          <button type="button" className="text-xs text-muted-foreground hover:text-foreground md:hidden" onClick={onBack}>
            ← Back
          </button>
          <div className="ml-auto flex items-center gap-4 text-xs font-semibold text-muted-foreground">
            <button type="button" className="flex items-center gap-1.5 hover:text-red-500 transition-colors">
              <Trash2 size={14} /> Delete
            </button>
            <button type="button" className="flex items-center gap-1.5 hover:text-amber-500 transition-colors">
              <Flag size={14} /> Flag
            </button>
            <button type="button" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
              <Archive size={14} /> Archive
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Sender Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full border border-border bg-gradient-to-tr from-slate-600 to-slate-700 dark:from-slate-700 dark:to-slate-800 grid place-items-center text-xs font-bold text-white shadow-md">
                {initials(message.senderName)}
              </div>
              <div>
                <div className="text-sm font-extrabold text-foreground">{message.senderName}</div>
                <div className="text-xs font-mono text-muted-foreground">{message.senderEmail}</div>
              </div>
            </div>
            <div className="text-xs font-mono text-muted-foreground">Date: Oct 26, 09:15 AM</div>
          </div>

          {/* Subject Header */}
          <div className="mt-6 text-sm font-bold text-foreground">
            <span className="text-muted-foreground">Subject: </span>
            {message.subject}
          </div>

          {/* Warning Banner */}
          {analysis?.flagged && !warningDismissed && (
            <div className="mt-5">
              <WarningBanner whyButtonRef={whyButtonRef} onSeeWhy={onSeeWhy} onContinue={onContinueReading} description={`Domain ${senderDomain} is unverified`} />
            </div>
          )}

          {/* Body Content */}
          <div className="mt-6 text-xs leading-relaxed text-foreground space-y-4">
            {message.body.map((paragraph, index) => (
              <p key={`${message.id}-body-${index}`} data-testid={`text-message-body-${index}`}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Security Summary & Actions Bar */}
      <div className="border-t border-border bg-muted/40 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-foreground">Security summary</div>
          <div className="text-[0.72rem] text-muted-foreground">Domain {senderDomain || 'external'} is unverified</div>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" className="rounded-xl border border-border bg-background px-4 py-2 text-xs font-bold text-foreground hover:bg-muted transition-all" onClick={onSeeWhy}>
            Analyze
          </button>
          <button type="button" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-500 dark:text-red-400 hover:bg-red-500/20 transition-all">
            Restrict
          </button>
          <button type="button" className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-bold hover:opacity-90 transition-all">
            Allow
          </button>
        </div>
      </div>
    </section>
  );
}