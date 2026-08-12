import { Archive, FileText, Send } from 'lucide-react';
import { Link } from 'wouter';

type EmptyStateProps = { kind: 'sent' | 'drafts' | 'spam' };

const content = {
  sent: { label: 'Sent', title: 'Nothing sent yet', description: 'Messages you send from this browser will appear here.', icon: Send },
  drafts: { label: 'Drafts', title: 'Your drafts are clear', description: 'Unfinished messages will stay here until you are ready to send them.', icon: FileText },
  spam: { label: 'Spam', title: 'No spam to review', description: 'Suspicious mail is shown in your inbox with a clear red indicator in this proof of concept.', icon: Archive },
};

export function EmptyState({ kind }: EmptyStateProps) {
  const item = content[kind];
  const Icon = item.icon;
  return (
    <section className="panel flex min-h-[31rem] flex-col items-center justify-center px-8 text-center">
      <div className="empty-illustration"><Icon size={25} /></div>
      <div className="eyebrow mt-6">{item.label}</div>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#1f4165]" data-testid={`heading-${kind}-empty`}>{item.title}</h1>
      <p className="mt-2 max-w-sm text-sm leading-6 text-[#7c90a5]">{item.description}</p>
      <Link href="/" className="primary-button mt-6" data-testid={`link-${kind}-back-inbox`}>Return to inbox</Link>
    </section>
  );
}