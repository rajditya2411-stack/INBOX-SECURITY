import { AlertTriangle, Info } from 'lucide-react';
import type { RefObject } from 'react';

type WarningBannerProps = {
  onSeeWhy: () => void;
  onContinue: () => void;
  whyButtonRef: RefObject<HTMLButtonElement | null>;
  description?: string;
};

export function WarningBanner({ onSeeWhy, onContinue, whyButtonRef, description = 'Security Guard detected characteristics that may require verification.' }: WarningBannerProps) {
  return (
    <section className="warning-banner p-4 sm:p-5 border border-amber-500/30 bg-amber-500/10 text-amber-300 rounded-xl" aria-labelledby="warning-title" data-testid="warning-banner">
      <div className="flex items-start gap-3">
        <span className="warning-icon shrink-0 bg-amber-500/20 text-amber-400 p-2 rounded-lg"><AlertTriangle size={18} /></span>
        <div className="min-w-0 flex-1">
          <h3 id="warning-title" className="text-sm font-bold text-amber-400" data-testid="text-warning-title">⚠️ [Unverified Domain]</h3>
           <p className="mt-1 text-xs leading-5 text-amber-200/90" data-testid="text-warning-description">{description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button ref={whyButtonRef} type="button" className="outline-button !border-amber-500/40 !bg-amber-500/20 !text-amber-300 hover:!bg-amber-500/30" onClick={onSeeWhy} data-testid="button-see-why"><Info size={14} />See Why</button>
            <button type="button" className="ghost-button !text-amber-200/80 hover:!text-amber-100" onClick={onContinue} data-testid="button-continue-reading">Continue Reading</button>
          </div>
        </div>
      </div>
    </section>
  );
}