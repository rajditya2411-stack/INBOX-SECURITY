import { Check, X } from 'lucide-react';
import { useEffect, useRef, type RefObject } from 'react';
import { MailMessage } from '@/data/messages';
import type { SecurityAnalysis, AnalysisSignalKey } from '@/lib/analyzer';

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
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      returnFocusRef.current?.focus();
    };
  }, [onClose, returnFocusRef]);

  return (
    <div className="modal-backdrop" role="presentation" onPointerDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} className="modal-card" role="dialog" aria-modal="true" aria-labelledby="why-flagged-title" aria-describedby="why-flagged-reason why-flagged-recommendation" data-testid="modal-why-flagged">
        <div className="flex items-start justify-between gap-4 border-b border-[#e7edf3] px-5 py-5 sm:px-6">
          <div>
            <div className="eyebrow">Guardian explanation</div>
            <h2 id="why-flagged-title" className="mt-1 text-lg font-bold text-[#234b73]">Why was this email flagged?</h2>
          </div>
           <button ref={closeButtonRef} type="button" className="rounded-lg p-2 text-[#7790a8] hover:bg-[#eef5fb] hover:text-[#315a81]" onClick={onClose} aria-label="Close explanation" data-testid="button-close-explanation"><X size={18} /></button>
        </div>
        <div className="space-y-5 px-5 py-5 sm:px-6">
          <div className="rounded-lg bg-[#fff7f7] p-3.5">
            <div className="text-xs font-bold uppercase tracking-[0.08em] text-[#a64b54]">Reason</div>
             <ul id="why-flagged-reason" className="mt-2 space-y-2 text-sm leading-6 text-[#62494d]" data-testid="text-flag-reason">
               {analysis.signals.map((signal) => (
                 <li key={signal} className="flex items-start gap-2"><span className="mt-0.5 text-[#a64b54]">{signal === 'urgencyDetected' ? '⚠' : '❌'}</span><span>{signalCopy[signal]}</span></li>
               ))}
             </ul>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
               <div className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#7891a8]">Trusted domains</div>
               <div className="mt-1 flex items-center gap-2 text-sm font-bold text-[#28547d]"><Check size={15} className="text-[#4c8b77]" />{trustedDomains.join(', ')}</div>
            </div>
            <div className="min-w-0">
              <div className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#7891a8]">Actual sender address</div>
              <div className="mt-1 truncate font-mono text-xs font-bold text-[#6d5360]" data-testid="text-actual-sender">{message.senderEmail}</div>
            </div>
          </div>
          <div className="border-t border-[#e7edf3] pt-4">
            <div className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#7891a8]">Recommendation</div>
             <p id="why-flagged-recommendation" className="mt-1 text-sm leading-6 text-[#536d86]" data-testid="text-recommendation">{analysis.recommendation}</p>
          </div>
        </div>
        <div className="flex justify-end border-t border-[#e7edf3] bg-[#fbfdff] px-5 py-4 sm:px-6">
          <button type="button" className="primary-button" onClick={onClose} data-testid="button-dismiss-explanation">Close</button>
        </div>
      </section>
    </div>
  );
}