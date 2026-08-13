import { Check, X, ShieldAlert, Sparkles, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { MailMessage } from '@/data/messages';
import type { SecurityAnalysis, AnalysisSignalKey } from '@/lib/analyzer';
import { useSecuritySettings } from '@/hooks/use-security-settings';
import { getLLMProvider } from '@/lib/llm/stubs';
import type { LLMAnalysisResult } from '@/lib/llm/types';

type ExplanationModalProps = {
  message: MailMessage;
  analysis: SecurityAnalysis;
  trustedDomains: string[];
  onClose: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
};

const signalCopy: Record<AnalysisSignalKey, string> = {
  externalSender: 'External sender',
  suspiciousLanguage: 'Suspicious language detected',
  urgencyDetected: 'Urgency detected',
  paymentRequest: 'Potential payment request',
  credentialRequest: 'Credential or login request detected',
  suspiciousLink: 'Suspicious link characteristics detected',
  lookalikeDomain: 'Potential lookalike domain',
  riskyAttachment: 'Potentially risky attachment',
};

export function ExplanationModal({ message, analysis, trustedDomains, onClose, returnFocusRef }: ExplanationModalProps) {
  const { settings, aiApiKey } = useSecuritySettings();
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const [aiResult, setAiResult] = useState<LLMAnalysisResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        last.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      returnFocusRef.current?.focus();
    };
  }, [onClose, returnFocusRef]);

  useEffect(() => {
    if (settings.aiProvider === 'none') {
      setAiResult(null);
      setAiLoading(false);
      return;
    }

    let isMounted = true;
    setAiLoading(true);
    setAiResult(null);

    const provider = getLLMProvider(settings.aiProvider);
    provider.analyze(message, analysis, aiApiKey, settings.aiModel).then((res) => {
      if (isMounted) {
        setAiResult(res);
        setAiLoading(false);
      }
    }).catch(() => {
      if (isMounted) {
        setAiLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [message, analysis, settings.aiProvider, settings.aiModel, aiApiKey]);

  const getRiskBadgeColor = (risk?: string) => {
    switch (risk?.toUpperCase()) {
      case 'CRITICAL':
      case 'HIGH':
        return 'bg-red-500/15 text-red-700 border-red-300 dark:text-red-400 dark:border-red-800';
      case 'MEDIUM':
        return 'bg-amber-500/15 text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-800';
      default:
        return 'bg-emerald-500/15 text-emerald-700 border-emerald-300 dark:text-emerald-400 dark:border-emerald-800';
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onPointerDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} className="modal-card max-w-2xl max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="why-flagged-title" aria-describedby="why-flagged-reason why-flagged-recommendation" data-testid="modal-why-flagged">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#e7edf3] dark:border-white/10 px-5 py-5 sm:px-6">
          <div>
            <div className="eyebrow flex items-center gap-1.5"><ShieldAlert size={14} /> Security Guard Explanation</div>
            <h2 id="why-flagged-title" className="mt-1 text-lg font-bold text-[#234b73] dark:text-white">Email Threat & Signal Analysis</h2>
          </div>
          <button ref={closeButtonRef} type="button" className="rounded-lg p-2 text-[#7790a8] hover:bg-[#eef5fb] hover:text-[#315a81] dark:hover:bg-white/10 dark:text-gray-400" onClick={onClose} aria-label="Close explanation" data-testid="button-close-explanation"><X size={18} /></button>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          {/* Section 1: Local Deterministic Security Engine */}
          <div className="rounded-xl border border-red-200 bg-[#fff7f7] dark:bg-red-950/20 dark:border-red-900/40 p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-[0.08em] text-[#a64b54] dark:text-red-400">Deterministic Security Engine</div>
              <span className="text-[0.68rem] font-mono font-bold px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/50 text-[#a64b54] dark:text-red-300">SCORE: {analysis.score}/100 ({analysis.riskLevel})</span>
            </div>
            <ul id="why-flagged-reason" className="mt-3 space-y-2 text-sm leading-6 text-[#62494d] dark:text-red-200" data-testid="text-flag-reason">
              {analysis.signals.map((signal) => (
                <li key={signal} className="flex items-start gap-2">
                  <span className="mt-0.5 text-[#a64b54] dark:text-red-400">{signal === 'urgencyDetected' ? '⚠' : '❌'}</span>
                  <span className="font-semibold">{signalCopy[signal]}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 2: Real AI Provider Threat Assistant */}
          <div className="rounded-xl border border-[#d2e3f3] bg-[#f4f8fd] dark:bg-[#161d27] dark:border-white/10 p-4">
            <div className="flex items-center justify-between border-b border-[#e1ecf7] dark:border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#234b73] dark:text-white">
                  AI Threat Analysis {settings.aiProvider !== 'none' && `(${settings.aiProvider.toUpperCase()})`}
                </span>
              </div>
              {aiResult?.riskLevel && (
                <span className={`text-[0.65rem] font-bold px-2.5 py-0.5 rounded-full border uppercase ${getRiskBadgeColor(aiResult.riskLevel)}`}>
                  {aiResult.riskLevel} RISK
                </span>
              )}
            </div>

            <div className="mt-3">
              {settings.aiProvider === 'none' ? (
                <div className="text-xs text-[#627d98] dark:text-gray-400 italic">
                  AI Provider is set to "None" in Settings. Deterministic security engine analysis is active. Select OpenAI, Gemini, Claude, or Grok in Settings for live AI insights.
                </div>
              ) : aiLoading ? (
                <div className="flex items-center gap-2 py-4 text-xs font-semibold text-[#3b6690] dark:text-blue-300">
                  <Loader2 size={16} className="animate-spin text-amber-500" />
                  <span>Requesting threat explanation from {settings.aiProvider.toUpperCase()} ({settings.aiModel || 'default model'})...</span>
                </div>
              ) : aiResult ? (
                <div className="space-y-3">
                  {aiResult.available ? (
                    <>
                      <p className="text-sm font-medium leading-relaxed text-[#234b73] dark:text-slate-200">
                        {aiResult.summary}
                      </p>
                      {aiResult.recommendedAction && (
                        <div className="rounded-lg bg-white/70 dark:bg-white/5 border border-[#d2e3f3] dark:border-white/10 p-3 text-xs text-[#28547d] dark:text-slate-300">
                          <strong className="font-bold text-[#1f4165] dark:text-white">AI Recommended Action: </strong>
                          {aiResult.recommendedAction}
                        </div>
                      )}
                      <div className="text-[0.68rem] text-[#7891a8] dark:text-gray-500 font-mono">
                        Model: {aiResult.modelUsed || settings.aiModel || 'default'} · Confidence: {Math.round((aiResult.confidence || 0.95) * 100)}%
                      </div>
                    </>
                  ) : (
                    <div className="flex items-start gap-2.5 text-xs text-[#a64b54] dark:text-red-400">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <span>{aiResult.error || 'AI provider unavailable. Deterministic security engine remains fully active.'}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-[#627d98] dark:text-gray-400">
                  Unable to load AI analysis. Deterministic engine result active.
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Technical Signals & Domain Verification */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-[#e7edf3] dark:border-white/10 p-3">
              <div className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#7891a8] dark:text-gray-400">Trusted Domains</div>
              <div className="mt-1 flex items-center gap-2 text-xs font-bold text-[#28547d] dark:text-slate-300">
                <Check size={14} className="text-[#4c8b77]" />
                {trustedDomains.join(', ')}
              </div>
            </div>
            <div className="rounded-lg border border-[#e7edf3] dark:border-white/10 p-3 min-w-0">
              <div className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#7891a8] dark:text-gray-400">Actual Sender</div>
              <div className="mt-1 truncate font-mono text-xs font-bold text-[#6d5360] dark:text-slate-300" data-testid="text-actual-sender">
                {message.senderEmail}
              </div>
            </div>
          </div>

          {/* Section 4: Engine Recommendation */}
          <div className="border-t border-[#e7edf3] dark:border-white/10 pt-4">
            <div className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#7891a8] dark:text-gray-400">Security Engine Recommendation</div>
            <p id="why-flagged-recommendation" className="mt-1 text-sm leading-6 text-[#536d86] dark:text-slate-300" data-testid="text-recommendation">
              {analysis.recommendation}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[#e7edf3] dark:border-white/10 bg-[#fbfdff] dark:bg-[#12161f] px-5 py-4 sm:px-6">
          <button type="button" className="primary-button" onClick={onClose} data-testid="button-dismiss-explanation">Close</button>
        </div>
      </section>
    </div>
  );
}