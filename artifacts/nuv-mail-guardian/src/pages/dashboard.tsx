import { AlertTriangle, BarChart3, Brain, ShieldCheck } from 'lucide-react';
import type { MailMessage } from '@/data/messages';
import type { SecurityAnalysis } from '@/lib/analyzer';
import { useSecuritySettings } from '@/hooks/use-security-settings';

type DashboardPageProps = {
  messages: MailMessage[];
  analyses: Record<string, SecurityAnalysis>;
};

export function DashboardPage({ messages, analyses }: DashboardPageProps) {
  const { settings, aiConfigured } = useSecuritySettings();
  const results = messages.map((message) => analyses[message.id]);
  const flagged = results.filter((analysis) => analysis.flagged).length;
  const highRisk = results.filter((analysis) => analysis.riskLevel === 'HIGH').length;
  const signalCount = results.reduce((total, analysis) => total + analysis.signals.length, 0);
  const stats = [
    { label: 'Emails scanned', value: messages.length, detail: 'Demo Mode sample inbox', icon: BarChart3 },
    { label: 'Flagged', value: flagged, detail: 'Messages with security signals', icon: AlertTriangle },
    { label: 'High risk', value: highRisk, detail: 'Multiple strong signals detected', icon: ShieldCheck },
    { label: 'AI analyses', value: 0, detail: aiConfigured ? 'Ready when you choose Analyze with AI' : 'Optional and not configured', icon: Brain },
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="eyebrow">Security overview</div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1f4165] sm:text-4xl" data-testid="heading-dashboard">A clearer view of your inbox.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#71869c]">Security Guard analyzes the Demo Mode inbox with transparent, local rules. External does not automatically mean malicious.</p>
        </div>
        <span className="demo-badge">DEMO MODE</span>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Security summary">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="panel p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#7891a8]">{stat.label}</span>
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#edf6ff] text-[#3373af]"><Icon size={17} /></span>
              </div>
              <div className="mt-4 text-3xl font-bold tracking-tight text-[#234b73]">{stat.value}</div>
              <p className="mt-1 text-xs leading-5 text-[#8093a7]">{stat.detail}</p>
            </div>
          );
        })}
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="panel overflow-hidden">
          <div className="border-b border-[#e8eef4] px-5 py-5 sm:px-7">
            <div className="eyebrow">Rule coverage</div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-[#1f4165]">What Security Guard checks</h2>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-7">
            {[
              ['Sender domain', 'Trusted domains and external sender signals'],
              ['Urgency', 'Pressure language and deadline patterns'],
              ['Payments', 'Payment, invoice, transfer, and fee requests'],
              ['Credentials', 'Password, login, OTP, and sign-in requests'],
              ['Links', 'HTTP, shorteners, lookalike hosts, and risky paths'],
              ['Attachments', 'Risky executable and archive extensions'],
            ].map(([label, description]) => (
              <div key={label} className="rounded-xl border border-[#e3edf5] bg-[#f8fbfe] p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[#315a81]"><ShieldCheck size={15} className="text-[#4c8b77]" />{label}</div>
                <p className="mt-2 text-xs leading-5 text-[#71869c]">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel overflow-hidden">
          <div className="border-b border-[#e8eef4] px-5 py-5 sm:px-7">
            <div className="eyebrow">Current posture</div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-[#1f4165]">Signals at a glance</h2>
          </div>
          <div className="space-y-4 p-5 sm:p-7">
            <div className="flex items-center justify-between rounded-xl bg-[#fff8f8] px-4 py-3">
              <span className="text-sm font-semibold text-[#6e4f55]">Detected signals</span>
              <strong className="text-lg text-[#a64b54]">{signalCount}</strong>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[#f4f8fc] px-4 py-3">
              <span className="text-sm font-semibold text-[#536d86]">Trusted domains</span>
              <strong className="text-sm text-[#28547d]">{settings.trustedDomains.length}</strong>
            </div>
            <p className="text-xs leading-5 text-[#8093a7]">Risk levels are explainable summaries of detected signals, not claims that a message is definitely malicious.</p>
          </div>
        </section>
      </div>
    </div>
  );
}