import { useState, useEffect, useRef, type RefObject } from 'react';
import { Server, X, Lock } from 'lucide-react';

type ImapConfigModalProps = {
  onClose: () => void;
  onConnected: (account: any) => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
};

export function ImapConfigModal({ onClose, onConnected, returnFocusRef }: ImapConfigModalProps) {
  const [host, setHost] = useState('');
  const [port, setPort] = useState('993');
  const [secure, setSecure] = useState(true);
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dialogRef = useRef<HTMLElement>(null);
  const hostInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    hostInputRef.current?.focus();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!host.trim() || !user.trim()) {
      setError('Host and username/email are required.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/imap/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: host.trim(),
          port: Number(port) || 993,
          secure,
          user: user.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to connect to IMAP server');
      }

      onConnected(data.account);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'IMAP connection error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section ref={dialogRef} className="modal-card !max-w-md" role="dialog" aria-modal="true" aria-labelledby="imap-title" data-testid="modal-imap-config">
        <div className="flex items-center justify-between border-b border-[#e7edf3] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Server size={16} className="text-[#3373af]" />
            <h2 id="imap-title" className="text-lg font-bold text-[#234b73]">Configure IMAP Server</h2>
          </div>
          <button type="button" className="rounded-lg p-2 text-[#7790a8] hover:bg-[#eef5fb] hover:text-[#315a81]" onClick={onClose} aria-label="Close IMAP config modal"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5 sm:p-6">
          {error && <div className="rounded-lg bg-[#fff7f7] px-4 py-2.5 text-xs font-semibold text-[#a64b54]">{error}</div>}

          <label className="block space-y-1">
            <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#7891a8]">IMAP Host</span>
            <input
              ref={hostInputRef}
              type="text"
              className="settings-input"
              placeholder="imap.mail.com"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              required
              data-testid="input-imap-host"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#7891a8]">Port</span>
              <input
                type="number"
                className="settings-input"
                placeholder="993"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                required
                data-testid="input-imap-port"
              />
            </label>

            <label className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                checked={secure}
                onChange={(e) => setSecure(e.target.checked)}
                className="h-4 w-4 rounded border-[#cde0f0] text-[#2a6db0]"
              />
              <span className="text-xs font-semibold text-[#446383]">Use SSL / TLS</span>
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#7891a8]">Email / Username</span>
            <input
              type="text"
              className="settings-input"
              placeholder="user@example.com"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              required
              data-testid="input-imap-user"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#7891a8]">Password</span>
            <input
              type="password"
              className="settings-input"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="input-imap-password"
            />
          </label>

          <div className="flex items-center justify-between border-t border-[#e7edf3] pt-4">
            <span className="flex items-center gap-1 text-[0.72rem] font-medium text-[#738b9e]">
              <Lock size={12} /> Credentials encrypted on server
            </span>
            <div className="flex items-center gap-2">
              <button type="button" className="ghost-button" onClick={onClose} disabled={isSubmitting}>Cancel</button>
              <button type="submit" className="primary-button" disabled={isSubmitting} data-testid="button-save-imap">Save & Connect</button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
