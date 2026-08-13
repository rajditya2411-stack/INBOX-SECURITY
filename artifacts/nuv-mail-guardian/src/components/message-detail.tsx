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
      <section className="panel detail-card flex flex-col items-center justify-center p-12 text-center border border-white/10 bg-[#12161f] rounded-2xl min-h-[500px]">
        <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 grid place-items-center text-amber-400 font-bold text-xl">
          🛡️
        </div>
        <h2 className="mt-4 text-base font-bold text-white">Select a message to inspect</h2>
        <p className="mt-1 text-xs text-[#8899ac]">Mail Guardian security analysis and rule-based verification signals will display here.</p>
      </section>
    );
  }

  const senderDomain = message.senderEmail.split('@')[1] || '';

  return (
    <section className="panel detail-card flex flex-col justify-between border border-white/10 bg-[#12161f] rounded-2xl overflow-hidden min-h-[600px]" data-testid={`panel-message-detail-${message.id}`}>
      <div>
        {/* Action Toolbar */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-3 bg-white/[0.02]">
          <button type="button" className="text-xs text-[#8899ac] hover:text-white md:hidden" onClick={onBack}>
            ← Back
          </button>
          <div className="ml-auto flex items-center gap-4 text-xs font-semibold text-[#8899ac]">
            <button type="button" className="flex items-center gap-1.5 hover:text-red-400 transition-colors">
              <Trash2 size={14} /> Delete
            </button>
            <button type="button" className="flex items-center gap-1.5 hover:text-amber-400 transition-colors">
              <Flag size={14} /> Flag
            </button>
            <button type="button" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Archive size={14} /> Archive
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Sender Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full border border-white/15 bg-gradient-to-tr from-slate-700 to-slate-800 grid place-items-center text-xs font-bold text-white shadow-md">
                {initials(message.senderName)}
              </div>
              <div>
                <div className="text-sm font-extrabold text-white">{message.senderName}</div>
                <div className="text-xs font-mono text-[#8899ac]">{message.senderEmail}</div>
              </div>
            </div>
            <div className="text-xs font-mono text-[#64748b]">Date: Oct 26, 09:15 AM</div>
          </div>

          {/* Subject Header */}
          <div className="mt-6 text-sm font-bold text-white">
            <span className="text-[#8899ac]">Subject: </span>
            {message.subject}
          </div>

          {/* Warning Banner */}
          {analysis?.flagged && !warningDismissed && (
            <div className="mt-5">
              <WarningBanner whyButtonRef={whyButtonRef} onSeeWhy={onSeeWhy} onContinue={onContinueReading} description={`Domain ${senderDomain} is unverified`} />
            </div>
          )}

          {/* Body Content */}
          <div className="mt-6 text-xs leading-relaxed text-[#cbd5e1] space-y-4">
            {message.body.map((paragraph, index) => (
              <p key={`${message.id}-body-${index}`} data-testid={`text-message-body-${index}`}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Security Summary & Actions Bar */}
      <div className="border-t border-white/10 bg-[#0c0f14]/80 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-white">Security summary</div>
          <div className="text-[0.72rem] text-[#8899ac]">Domain {senderDomain || 'external'} is unverified</div>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white hover:bg-white/10 transition-all" onClick={onSeeWhy}>
            Analyze
          </button>
          <button type="button" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-all">
            Restrict
          </button>
          <button type="button" className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-black hover:bg-slate-200 transition-all">
            Allow
          </button>
        </div>
      </div>
    </section>
  );
}