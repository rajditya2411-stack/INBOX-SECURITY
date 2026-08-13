import { ArrowLeft, Mail, Reply, ShieldCheck } from 'lucide-react';
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

export function MessageDetail({ message, analysis, trustedDomains, aiApiKey, aiConfigured, aiProvider, aiModel, warningDismissed, whyButtonRef, onSeeWhy, onContinueReading, onBack, onReply }: MessageDetailProps) {
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  if (!message) {
    return (
      <section className="panel detail-card flex flex-col items-center justify-center px-8 text-center">
        <div className="empty-illustration"><Mail size={25} /></div>
        <h2 className="mt-5 text-lg font-bold text-[#2a4d70]">Choose a message to read</h2>
        <p className="mt-2 max-w-xs text-sm leading-6 text-[#7c90a5]">Your selected email will open here. Security Guard will show the rule-based signals before you read a flagged message.</p>
      </section>
    );
  }

  const detectedSignals = analysis?.signals.length ?? 0;
  const runAIAnalysis = async () => {
    if (!analysis) return;
    const provider = createAIProvider(aiProvider, aiApiKey, aiModel);
    if (!provider) {
      setAiResult({ available: false, error: 'AI analysis unavailable. Rule-based analysis is still active.' });
      return;
    }
    setAiResult(await provider.analyze(message, analysis));
  };
  return (
    <section className="panel detail-card" data-testid={`panel-message-detail-${message.id}`}>
      <div className="detail-topline flex items-center justify-between gap-3 px-5 py-3 sm:px-7">
        <button type="button" className="ghost-button -ml-2 md:hidden" onClick={onBack} data-testid="button-back-to-inbox"><ArrowLeft size={15} />Back to inbox</button>
        <div className="ml-auto flex items-center gap-3">
          {onReply && (
            <button type="button" className="outline-button !py-1 !px-3 text-xs" onClick={() => onReply(message)} data-testid="button-reply">
              <Reply size={14} />
              Reply
            </button>
          )}
          <span className="hidden items-center gap-2 text-xs font-bold text-[#4c8b77] md:flex" data-testid="status-message-trust">
            {analysis?.flagged ? <><span className="suspicious-dot" />Potentially suspicious</> : <><ShieldCheck size={15} />No rule-based signals</>}
          </span>
        </div>
      </div>
      <div className="p-5 sm:p-7">
        {analysis?.flagged && !warningDismissed && <WarningBanner whyButtonRef={whyButtonRef} onSeeWhy={onSeeWhy} onContinue={onContinueReading} />}
        <article className={analysis?.flagged || warningDismissed ? 'mt-6' : 'mt-1'} data-testid={`article-message-${message.id}`}>
          <div className="eyebrow">Message</div>
           <h1 className="mt-2 break-words text-2xl font-bold leading-tight tracking-tight text-[#f0f4f8] sm:text-[1.75rem]" data-testid="text-message-subject">{message.subject}</h1>
          <div className="mt-6 flex items-start gap-3 border-b border-white/10 pb-5">
            <span className="sender-avatar !h-10 !w-10">{initials(message.senderName)}</span>
            <div className="min-w-0">
              <div className="font-bold text-[#f0f4f8]" data-testid="text-detail-sender">{message.senderName}</div>
              <div className="mt-0.5 break-all text-xs text-[#94a3b8]" data-testid="text-detail-email">{message.senderEmail}</div>
            </div>
            <time className="ml-auto shrink-0 text-xs text-[#64748b]">{message.time}</time>
          </div>
           {analysis?.flagged && !warningDismissed ? (
             <div className="mt-7 rounded-xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm leading-6 text-[#fcd34d]" data-testid="text-message-content-hidden">
               Choose “Continue Reading” to view the message content safely.
             </div>
           ) : (
             <div className="prose prose-sm mt-7 max-w-none text-[#cbd5e1] leading-relaxed">
               {message.body.map((paragraph, index) => (
                 <p key={`${message.id}-body-${index}`} className="mb-4 leading-7 text-[#cbd5e1]" data-testid={`text-message-body-${index}`}>{paragraph}</p>
               ))}
             </div>
           )}
           {analysis?.flagged && warningDismissed && (
             <div className="mt-6 border-t border-white/10 pt-5">
               <div className="flex flex-wrap items-center gap-2">
                 <span className={`risk-pill risk-${analysis.riskLevel.toLowerCase()}`}>{analysis.riskLevel} risk</span>
                 <span className="text-xs text-[#94a3b8]">{detectedSignals} signal{detectedSignals === 1 ? '' : 's'} detected</span>
                 {aiConfigured && <button type="button" className="outline-button" onClick={runAIAnalysis}>Analyze with AI</button>}
               </div>
               {aiResult && <div className="mt-3 rounded-lg bg-white/5 px-4 py-3 text-sm text-[#cbd5e1]" data-testid="ai-analysis-result">{aiResult.error ?? aiResult.summary}</div>}
               {!aiConfigured && <p className="mt-3 text-xs text-[#64748b]">Optional AI analysis is not configured. Rule-based analysis remains active.</p>}
             </div>
           )}
        </article>
      </div>
    </section>
  );
}