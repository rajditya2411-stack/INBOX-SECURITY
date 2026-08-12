import { Send, FileText, X } from 'lucide-react';
import { useState, useEffect, useRef, type RefObject } from 'react';
import type { CreateMessagePayload } from '@/lib/providers';

type ComposeModalProps = {
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
  onSend: (payload: CreateMessagePayload) => Promise<void>;
  onSaveDraft: (payload: CreateMessagePayload) => Promise<void>;
  onClose: () => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
};

export function ComposeModal({ initialTo = '', initialSubject = '', initialBody = '', onSend, onSaveDraft, onClose, returnFocusRef }: ComposeModalProps) {
  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dialogRef = useRef<HTMLElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    toInputRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      );
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
      returnFocusRef?.current?.focus();
    };
  }, [onClose, returnFocusRef]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim()) {
      setError('Please enter a recipient email address.');
      return;
    }
    if (!body.trim()) {
      setError('Please enter message content.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await onSend({ to: to.trim(), subject: subject.trim(), body: body.trim() });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to send message.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      await onSaveDraft({ to: to.trim(), subject: subject.trim(), body: body.trim() });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save draft.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onPointerDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} className="modal-card !max-w-xl" role="dialog" aria-modal="true" aria-labelledby="compose-title" data-testid="modal-compose">
        <div className="flex items-center justify-between border-b border-[#e7edf3] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Send size={16} className="text-[#3373af]" />
            <h2 id="compose-title" className="text-lg font-bold text-[#234b73]">New Message</h2>
          </div>
          <button type="button" className="rounded-lg p-2 text-[#7790a8] hover:bg-[#eef5fb] hover:text-[#315a81]" onClick={onClose} aria-label="Close compose modal"><X size={18} /></button>
        </div>

        <form onSubmit={handleSend} className="space-y-4 p-5 sm:p-6">
          {error && <div className="rounded-lg bg-[#fff7f7] px-4 py-2.5 text-xs font-semibold text-[#a64b54]">{error}</div>}

          <label className="block space-y-1">
            <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#7891a8]">To</span>
            <input
              ref={toInputRef}
              type="email"
              className="settings-input"
              placeholder="recipient@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              required
              data-testid="input-compose-to"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#7891a8]">Subject</span>
            <input
              type="text"
              className="settings-input"
              placeholder="Subject line"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              data-testid="input-compose-subject"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#7891a8]">Message</span>
            <textarea
              className="settings-input min-h-[140px] resize-y p-3"
              placeholder="Write your email here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              data-testid="textarea-compose-body"
            />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e7edf3] pt-4">
            <button
              type="button"
              className="outline-button"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
              data-testid="button-save-draft"
            >
              <FileText size={14} />
              Save Draft
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="ghost-button"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-button"
                disabled={isSubmitting}
                data-testid="button-send-email"
              >
                <Send size={14} />
                Send
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
