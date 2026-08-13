import { Archive, BarChart2, Bell, FileText, HelpCircle, Inbox, LayoutDashboard, Menu, MessageSquare, Moon, Search, Send, Settings, ShieldCheck, SquarePen, Sun, Trash2, User, X } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useEffect, useRef, useState } from 'react';
import { useSecuritySettings } from '@/hooks/use-security-settings';

type MailLayoutProps = { children: React.ReactNode; inboxCount: number; onCompose?: () => void };

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Inbox', href: '/', icon: Inbox },
  { label: 'Sent', href: '/sent', icon: Send },
  { label: 'Drafts', href: '/drafts', icon: FileText },
  { label: 'Spam', href: '/spam', icon: Archive },
  { label: 'Trash', href: '/trash', icon: Trash2 },
  { label: 'Security', href: '/security', icon: ShieldCheck },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function MailLayout({ children, inboxCount, onCompose }: MailLayoutProps) {
  const { settings, toggleTheme } = useSecuritySettings();
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
    <div className="app-shell flex bg-background text-foreground min-h-screen">
      {/* Sidebar */}
      <aside className="app-sidebar flex w-60 shrink-0 flex-col justify-between border-r border-white/10 dark:bg-[#12161f]/90 light:bg-slate-900 p-5 backdrop-blur-xl" data-open={sidebarOpen}>
        <div>
          <div className="mb-8 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3" data-testid="link-brand">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500 text-white shadow-lg shadow-amber-500/20 font-bold text-lg">
                🛡️
              </span>
              <span className="font-extrabold text-base tracking-tight text-white">Mail Guardian</span>
            </Link>
            <button ref={closeButtonRef} type="button" className="rounded-md p-1 text-[#8899ac] md:hidden" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} data-testid="button-close-nav">
              <X size={18} />
            </button>
          </div>

          {onCompose && (
            <div className="mb-6">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-500"
                onClick={() => { setSidebarOpen(false); onCompose(); }}
                data-testid="button-compose-sidebar"
              >
                <SquarePen size={15} />
                + Compose
              </button>
            </div>
          )}

          <nav id="primary-navigation" className="space-y-1.5" aria-label="Primary navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.href === '/' ? location === '/' : location.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${active ? 'bg-white/10 text-white font-bold border border-white/15 shadow-sm' : 'text-[#8899ac] hover:bg-white/5 hover:text-white'}`}
                  data-active={active}
                  data-testid={`link-${item.label.toLowerCase()}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
                    <span>{item.label}</span>
                  </div>
                  {item.label === 'Inbox' && (
                    <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[0.65rem] font-bold text-[#8899ac]">{inboxCount}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-white/10">
          <Link href="/help" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#8899ac] hover:bg-white/5 hover:text-white">
            <HelpCircle size={16} />
            <span>Help</span>
          </Link>
        </div>
      </aside>

      {sidebarOpen && <button type="button" aria-label="Close navigation overlay" className="mobile-sidebar-scrim" onClick={() => setSidebarOpen(false)} data-testid="button-navigation-overlay" />}

      {/* Main App Layout */}
      <div className="min-w-0 flex-1 flex flex-col">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card/90 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button ref={menuButtonRef} type="button" className="mobile-menu-button rounded-lg border border-border bg-input p-2 text-muted-foreground md:hidden" aria-label="Open navigation" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(true)}>
              <Menu size={18} />
            </button>
            <h1 className="text-lg font-extrabold text-foreground">Inbox</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Field */}
            <div className="relative flex items-center">
              <Search size={15} className="absolute left-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="w-56 rounded-xl border border-border bg-input py-1.5 pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>

            {/* Message Icon */}
            <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
              <MessageSquare size={18} />
            </button>

            {/* Notification Bell */}
            <button type="button" className="relative text-muted-foreground hover:text-foreground transition-colors">
              <Bell size={18} />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500" />
            </button>

            {/* Theme Switcher */}
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl border border-border bg-input px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted transition-all"
              onClick={toggleTheme}
              title="Switch Light / Dark theme"
            >
              {settings.theme === 'dark' ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-blue-500" />}
            </button>

            {/* Profile Avatar */}
            <div className="h-8 w-8 overflow-hidden rounded-full border border-white/15 bg-gradient-to-tr from-amber-500 to-orange-500 grid place-items-center text-xs font-bold text-white shadow-sm">
              DC
            </div>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
