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
  // --- INBOX (MIX OF SAFE & SENSITIVE TEAM EMAILS) ---
  {
    id: 'project-meeting',
    senderName: 'Alex Morgan',
    senderEmail: 'alex@company.com',
    subject: 'Q3 Security Architecture Review & Milestone Sync',
    preview: 'Sharing the preliminary agenda and architectural notes before our sync tomorrow morning.',
    time: '9:42 AM',
    body: [
      'Hi team,',
      'Sharing a quick agenda before our project sync tomorrow morning. We will review the current milestones for Phase 7 Hardening and agree on the next two production deliverables.',
      '1. Review deterministic security engine rules and test coverage.',
      '2. Finalize multi-provider LLM integration fallback behavior.',
      'See you there,',
      'Alex Morgan (Senior Systems Architect)',
    ],
    folder: 'inbox',
  },
  {
    id: 'vendor-invoice-review',
    senderName: 'Finance Operations',
    senderEmail: 'billing@trusted-vendor.com',
    subject: 'Monthly Infrastructure Subscription Statement — October',
    preview: 'Your latest cloud infrastructure statement is ready for review in your billing dashboard.',
    time: '8:15 AM',
    body: [
      'Hello Security Team,',
      'Your monthly cloud infrastructure and hosting statement for October is now available. The total charge of $420.00 will be processed automatically on your default billing card.',
      'You can download the itemized breakdown anytime from your standard account portal.',
      'Thank you for your business,',
      'Finance Operations Team',
    ],
    folder: 'inbox',
  },
  {
    id: 'team-update',
    senderName: 'Jordan Lee',
    senderEmail: 'manager@company.com',
    subject: 'Engineering Team Update & Sprint Retrospective',
    preview: 'A short update on this week’s release priorities, code reviews, and upcoming team schedule.',
    time: 'Yesterday',
    body: [
      'Hello everyone,',
      'Here is a short update on this week’s engineering priorities. We successfully completed Phase 6 LLM proxy testing with zero breaking changes across all 4 AI providers.',
      'Thank you for keeping code quality high and maintainable.',
      'Best regards,',
      'Jordan Lee',
    ],
    folder: 'inbox',
  },
  {
    id: 'external-partner-sync',
    senderName: 'Elena Rostova',
    senderEmail: 'elena.rostova@partner-services.org',
    subject: 'Security Audit Collaboration & API Specifications',
    preview: 'Attached are the updated API specifications for the external security audit integration.',
    time: 'Yesterday',
    body: [
      'Hi Security Guard team,',
      'Following up on our discussion last Tuesday. We have updated the integration specifications for the external security signal feed.',
      'Please take a look at the attached documents and let us know if you need any adjustments to the schema.',
      'Best,',
      'Elena Rostova',
    ],
    attachments: ['audit_specifications_v2.pdf'],
    folder: 'inbox',
  },

  // --- SPAM / THREAT DEMOS (EXERCISING URGENCY, PAYMENTS, CREDENTIALS, LINKS, ATTACHMENTS) ---
  {
    id: 'verify-account-phish',
    senderName: 'Security Desk',
    senderEmail: 'security-alert@secures-login-portal.net',
    subject: 'URGENT: Immediate Action Required — Account Verification Pending',
    preview: 'Your email account will be permanently suspended within 24 hours unless you verify your credentials immediately.',
    time: '10:30 AM',
    body: [
      'IMMEDIATE ACTION REQUIRED.',
      'We detected unauthorized login attempts from an unknown IP address on your account. To prevent immediate account restriction, you must verify your login credentials and single sign-on password within 24 hours.',
      'Click the secure link below to confirm your password and 2FA code:',
      'http://secures-login-portal.net/verify-credentials?user=target',
      'Failure to comply will result in account lockout.',
      'Account Security Operations',
    ],
    attachments: ['verification_token.exe'],
    folder: 'spam',
  },
  {
    id: 'wire-transfer-scam',
    senderName: 'Executive Office',
    senderEmail: 'ceo-office@suspicious-mail-domain.xyz',
    subject: 'URGENT: Emergency Wire Transfer & Confidential Invoice Payment',
    preview: 'Kindly process this urgent wire transfer payment of $14,500 today before banking hours close.',
    time: 'Yesterday',
    body: [
      'Hello,',
      'I am currently in an executive board meeting with limited phone reception. I need you to process an urgent confidential wire transfer payment of $14,500 for an emergency acquisition.',
      'Please send the bank transfer confirmation receipt to this email within 2 hours. Use the attached payment instructions.',
      'Regards,',
      'Chief Executive Officer',
    ],
    attachments: ['wire_instructions.pdf.exe'],
    folder: 'spam',
  },
  {
    id: 'fake-microsoft-alert',
    senderName: 'Microsoft Security Team',
    senderEmail: 'support@micros0ft-security-auth.info',
    subject: 'Security Alert: Password Expiration Notice & OTP Reset',
    preview: 'Your password expires today. Sign in immediately to reset your Microsoft 365 credentials.',
    time: '2 days ago',
    body: [
      'Your Microsoft 365 password will expire in 2 hours.',
      'Please sign in to the authentication portal below to update your password, username, and OTP passcode:',
      'http://bit.ly/m365-pass-reset-urgent',
      'If you do not update your credentials today, your mailbox access will be disabled.',
      'Microsoft Online Security',
    ],
    folder: 'spam',
  },

  // --- SENT MAIL ---
  {
    id: 'sent-sample-1',
    senderName: 'You',
    senderEmail: 'you@company.com',
    subject: 'Re: Q3 Security Architecture Review & Milestone Sync',
    preview: 'Thanks Alex — I have updated the deterministic rule engine tests and verified LLM fallback behavior.',
    time: 'Yesterday',
    body: [
      'Hi Alex,',
      'Thanks for the agenda. I have updated the deterministic rule engine unit tests and confirmed that all 4 AI providers degrade gracefully when API keys are omitted.',
      'Looking forward to the sync tomorrow.',
      'Best,',
      'You',
    ],
    folder: 'sent',
  },
  {
    id: 'sent-sample-2',
    senderName: 'You',
    senderEmail: 'you@company.com',
    subject: 'Security Policy Update Confirmation',
    preview: 'Confirmed receipt of the Q3 security policy documentation. All requirements have been integrated.',
    time: '3 days ago',
    body: [
      'Hi Elena,',
      'Confirming receipt of the integration specs. Everything matches our normalized email schema perfectly.',
      'Best,',
      'You',
    ],
    folder: 'sent',
  },

  // --- DRAFTS ---
  {
    id: 'draft-sample-1',
    senderName: 'You',
    senderEmail: 'you@company.com',
    subject: 'Draft: Phase 7 Release Checklist & Security Audit Notes',
    preview: 'Drafting the final open-source security audit findings and deployment configuration guide.',
    time: 'Saved 10m ago',
    body: [
      'Draft Release Notes:',
      '- Verified deterministic engine scoring logic.',
      '- Verified OAuth 2.0 token AES-256-GCM encryption.',
      '- Checked Light/Dark mode contrast compliance.',
    ],
    folder: 'drafts',
  },

  // --- TRASH ---
  {
    id: 'trash-sample-1',
    senderName: 'Marketing Weekly',
    senderEmail: 'newsletter@promo-deals.example',
    subject: 'Weekly Tech Digest & Developer Special Offers',
    preview: 'Here are the top developer tools and special promotional highlights of the week.',
    time: '2 weeks ago',
    body: [
      'Hello subscriber,',
      'Here are the top tech articles and developer offers for this week.',
      'Unsubscribe anytime.',
    ],
    folder: 'trash',
  },
];

export function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}
