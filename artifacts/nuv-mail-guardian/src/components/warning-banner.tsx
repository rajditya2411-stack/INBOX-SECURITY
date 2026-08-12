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
    <section className="warning-banner p-4 sm:p-5" aria-labelledby="warning-title" data-testid="warning-banner">
      <div className="flex items-start gap-3">
        <span className="warning-icon shrink-0"><AlertTriangle size={17} /></span>
        <div className="min-w-0 flex-1">
          <h3 id="warning-title" className="text-sm font-bold text-[#923640]" data-testid="text-warning-title">⚠ Suspicious Email</h3>
           <p className="mt-1 text-xs leading-5 text-[#7f5a5c]" data-testid="text-warning-description">{description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button ref={whyButtonRef} type="button" className="outline-button !border-[#e7b9bc] !bg-transparent !text-[#923640]" onClick={onSeeWhy} data-testid="button-see-why"><Info size={14} />See Why</button>
            <button type="button" className="ghost-button !text-[#8c5559]" onClick={onContinue} data-testid="button-continue-reading">Continue Reading</button>
          </div>
        </div>
      </div>
    </section>
  );
}