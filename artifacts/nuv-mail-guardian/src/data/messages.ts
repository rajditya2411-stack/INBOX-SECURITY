export type MailMessage = {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  preview: string;
  time: string;
  body: string[];
  attachments?: string[];
  folder?: 'inbox' | 'sent' | 'drafts' | 'spam' | 'trash';
};

export const messages: MailMessage[] = [
  {
    id: 'project-meeting',
    senderName: 'Alex Morgan',
    senderEmail: 'alex@company.com',
    subject: 'Project Meeting Tomorrow',
    preview: 'A quick agenda and a few notes before our project sync tomorrow morning.',
    time: '9:42 AM',
    body: [
      'Hi team,',
      'Sharing a quick agenda before our project sync tomorrow morning. We will review the current milestones and agree on the next two deliverables.',
      'See you there,',
      'Alex Morgan',
    ],
    folder: 'inbox',
  },
  {
    id: 'monthly-statement',
    senderName: 'Trusted Bank',
    senderEmail: 'billing@trustedbank.example',
    subject: 'Monthly Statement',
    preview: 'Your latest monthly statement is ready to review in your usual account portal.',
    time: 'Yesterday',
    body: [
      'Hello,',
      'Your latest monthly statement is ready to review in your usual account portal. No action is required by email.',
      'Trusted Bank',
    ],
    folder: 'inbox',
  },
  {
    id: 'team-update',
    senderName: 'Jordan Lee',
    senderEmail: 'manager@company.com',
    subject: 'Team Update',
    preview: 'A short update on this week’s priorities and the upcoming team schedule.',
    time: 'Yesterday',
    body: [
      'Hello everyone,',
      'Here is a short update on this week’s priorities and the upcoming team schedule. Thank you for keeping the handoffs moving.',
      'Jordan',
    ],
    folder: 'inbox',
  },
  {
    id: 'benefits-review',
    senderName: 'People Operations',
    senderEmail: 'people@company.com',
    subject: 'Benefits review window',
    preview: 'The annual benefits review window opens next week. Details are in the employee handbook.',
    time: 'Mon',
    body: [
      'Hi,',
      'The annual benefits review window opens next week. Details and the schedule are available in the employee handbook.',
      'People Operations',
    ],
    folder: 'inbox',
  },
  {
    id: 'community-news',
    senderName: 'Community Desk',
    senderEmail: 'news@community.org',
    subject: 'Community newsletter',
    preview: 'A few local events and community updates for the month ahead.',
    time: 'Mon',
    body: [
      'Hello,',
      'Here are a few local events and community updates for the month ahead. We hope you find something useful.',
      'Community Desk',
    ],
    folder: 'inbox',
  },
  {
    id: 'workspace-guide',
    senderName: 'Workspace Support',
    senderEmail: 'support@company.com',
    subject: 'New workspace guide',
    preview: 'We published a short guide to help teams organize shared project spaces.',
    time: 'Sun',
    body: [
      'Hi team,',
      'We published a short guide to help teams organize shared project spaces. You can find it in the internal knowledge base.',
      'Workspace Support',
    ],
    folder: 'inbox',
  },
  {
    id: 'verify-account',
    senderName: 'Account Security',
    senderEmail: 'security-alert@random-domain.example',
    subject: 'URGENT: Verify Your Account',
    preview: 'Your account will be restricted today unless you verify your details immediately.',
    time: 'Sun',
    body: [
      'Urgent action required.',
      'Your account will be restricted today unless you verify your details immediately. Confirm your password at http://bit.ly/verify-account.',
      'Account Security',
    ],
    attachments: ['account-update.zip'],
    folder: 'spam',
  },
  {
    id: 'payment-required',
    senderName: 'Billing Services',
    senderEmail: 'billing@unknown-domain.example',
    subject: 'Payment Required Immediately',
    preview: 'Payment is required today to avoid a service interruption. Use the payment link below.',
    time: 'Sat',
    body: [
      'Final notice.',
      'Payment is required immediately to avoid a service interruption. Complete the bank transfer using this payment link: https://unknown-domain.example/payment.',
      'Billing Services',
    ],
    folder: 'spam',
  },
  {
    id: 'account-suspended',
    senderName: 'Microsoft Security Team',
    senderEmail: 'support@micros0ft-security.example',
    subject: 'Your Account Will Be Suspended',
    preview: 'Your account will be disabled unless you sign in and confirm your credentials today.',
    time: 'Fri',
    body: [
      'Your account will be disabled today.',
      'Sign in immediately and confirm your password and OTP to keep access: https://micros0ft-security.example/login.',
      'Microsoft Security Team',
    ],
    folder: 'spam',
  },
  {
    id: 'payroll-warning',
    senderName: 'Payroll Processing',
    senderEmail: 'payroll@random-domain.example',
    subject: 'Final warning: payroll action required',
    preview: 'Send payment details within 24 hours or your next payroll transfer may be delayed.',
    time: 'Thu',
    body: [
      'Final warning.',
      'Send payment details within 24 hours or your next payroll transfer may be delayed. Reply with your bank transfer information.',
      'Payroll Processing',
    ],
    attachments: ['payroll-form.js'],
    folder: 'spam',
  },
  // Sent / Drafts / Trash demo messages
  {
    id: 'sent-sample-1',
    senderName: 'You',
    senderEmail: 'you@company.com',
    subject: 'Re: Project Meeting',
    preview: 'Thanks — see you at the meeting tomorrow.',
    time: 'Yesterday',
    body: ['Thanks — see you at the meeting tomorrow.', 'Best,', 'You'],
    folder: 'sent',
  },
  {
    id: 'draft-sample-1',
    senderName: 'You',
    senderEmail: 'you@company.com',
    subject: 'Draft: Follow up',
    preview: 'Draft: Quick follow up about the milestones.',
    time: 'Tue',
    body: ['Draft: Quick follow up about the milestones.'],
    folder: 'drafts',
  },
  {
    id: 'trash-sample-1',
    senderName: 'Newsletter',
    senderEmail: 'offers@newsletter.example',
    subject: 'Old promotion',
    preview: 'An old promotional message you archived.',
    time: '2 weeks ago',
    body: ['Old promotion content'],
    folder: 'trash',
  },
];

export function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}
