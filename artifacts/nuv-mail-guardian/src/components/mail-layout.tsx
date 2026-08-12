import { Archive, FileText, Inbox, LayoutDashboard, Menu, Settings, ShieldCheck, Send, SquarePen, Trash2, X } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useEffect, useRef, useState } from 'react';

type MailLayoutProps = { children: React.ReactNode; inboxCount: number; onCompose?: () => void };

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Inbox', href: '/', icon: Inbox },
  { label: 'Sent', href: '/sent', icon: Send },
  { label: 'Drafts', href: '/drafts', icon: FileText },
  { label: 'Spam', href: '/spam', icon: Archive },
  { label: 'Trash', href: '/trash', icon: Trash2 },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function MailLayout({ children, inboxCount, onCompose }: MailLayoutProps) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!sidebarOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      menuButtonRef.current?.focus();
    };
  }, [sidebarOpen]);

  return (
    <div className="app-shell flex">
      <aside className="app-sidebar flex w-64 shrink-0 flex-col px-4 py-5" data-open={sidebarOpen}>
        <div className="mb-6 flex items-center justify-between px-2">
          <Link href="/" className="flex items-center gap-3" data-testid="link-brand">
            <span className="brand-mark">N/</span>
            <span>
               <span className="block text-[0.95rem] font-bold tracking-tight text-white">Security Guard</span>
               <span className="block text-[0.66rem] font-medium uppercase tracking-[0.16em] text-[#9eb5cf]">Open-source security</span>
            </span>
          </Link>
           <button ref={closeButtonRef} type="button" className="rounded-md p-1 text-[#b9cbe0] md:hidden" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} data-testid="button-close-nav">
            <X size={18} />
          </button>
        </div>

        {onCompose && (
          <div className="mb-6 px-1">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2a6db0] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#235d97] active:bg-[#1c4d7e]"
              onClick={() => { setSidebarOpen(false); onCompose(); }}
              data-testid="button-compose-sidebar"
            >
              <SquarePen size={16} />
              Compose
            </button>
          </div>
        )}

        <div className="mb-3 px-3 eyebrow !text-[#8099b6]">Workspace</div>
         <nav id="primary-navigation" className="space-y-1" aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.href === '/' ? location === '/' : location.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="nav-item"
                data-active={active}
                data-testid={`link-${item.label.toLowerCase()}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={17} strokeWidth={active ? 2.3 : 1.8} />
                <span>{item.label}</span>
                 {item.label === 'Inbox' && <span className="ml-auto rounded-full bg-[#2f73c9] px-2 py-0.5 text-[0.65rem] font-bold text-white">{inboxCount}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-xl border border-[#34506e] bg-[#203a59] p-4">
          <div className="mb-3 flex items-center gap-2 text-[#dcecff]">
            <ShieldCheck size={17} />
             <span className="text-xs font-bold">Security Guard is active</span>
          </div>
           <p className="text-[0.72rem] leading-5 text-[#a9c0d9]">Rule-based signals help you pause and verify unusual requests.</p>
        </div>
      </aside>
      {sidebarOpen && <button type="button" aria-label="Close navigation overlay" className="mobile-sidebar-scrim" onClick={() => setSidebarOpen(false)} data-testid="button-navigation-overlay" />}
      <div className="min-w-0 flex-1">
        <header className="page-header sticky top-0 z-20 flex min-h-[4.65rem] items-center justify-between gap-4 px-4 py-3 sm:px-7 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
             <button ref={menuButtonRef} type="button" className="mobile-menu-button rounded-lg border border-[#d7e3ee] bg-white p-2 text-[#31577f]" aria-label="Open navigation" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(true)}>
              <Menu size={19} />
            </button>
            <div className="min-w-0">
               <div className="truncate text-sm font-bold tracking-tight text-[#294b70]">Security Guard</div>
               <div className="hidden truncate text-xs text-[#71869c] sm:block">Open-source email security, powered by your own AI.</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 text-xs text-[#6f8298] sm:flex" data-testid="status-local-only">
              <span className="h-2 w-2 rounded-full bg-[#5a9b89]" />
               Demo Mode
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#dbeeff] text-xs font-bold text-[#245786]" data-testid="avatar-student">AR</div>
          </div>
        </header>
        <main className="content-wrap px-4 py-6 sm:px-7 sm:py-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
