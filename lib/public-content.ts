import { SUPPORT_EMAIL } from "./site-config";

export const CONTACT_SUPPORT_EMAIL = SUPPORT_EMAIL;

export const CONTACT_BUSINESS_HOURS = [
  "Monday - Friday",
  "9:00 AM - 6:00 PM IST",
] as const;

export const CONTACT_RESPONSE_TIME = "Within 24-48 hours";

export const CONTACT_CATEGORIES = [
  "General Inquiry",
  "Technical Support",
  "Account Issue",
  "Billing",
  "Feature Request",
  "Bug Report",
] as const;

export const CONTACT_FAQS = [
  {
    question: "How quickly do you respond to support requests?",
    answer:
      "We usually respond within 24-48 hours during business days, depending on request volume and complexity.",
  },
  {
    question: "Can I get help with my Google login or Gmail permissions?",
    answer:
      "Yes. Contact us if you need help with Google sign-in, permission revocation, or Gmail-related functionality.",
  },
  {
    question: "Do you handle billing and account issues through this form?",
    answer:
      "Yes. Use the Billing or Account Issue category and include any relevant details so we can route the request quickly.",
  },
] as const;

export const CONTACT_SOCIAL_LINKS = [
  { label: "LinkedIn", href: "#" },
  { label: "X (Twitter)", href: "#" },
  { label: "GitHub", href: "#" },
] as const;

export const PRIVACY_POLICY_LAST_UPDATED = "August 3, 2026";

export const PRIVACY_POLICY_LINKS = [
  { label: "Contact Us", href: "/contact" },
  { label: "Terms of Service", href: "/terms" },
] as const;

export const PRIVACY_POLICY_SECTIONS = [
  {
    id: "introduction",
    title: "Introduction",
    body: [
      "This Privacy Policy explains how JobPilot collects, uses, stores, and protects information when you use our website, application, Google authentication, Gmail integration, and AI-powered career tools.",
      "By using JobPilot, you agree to the practices described below. If you do not agree with this policy, please discontinue use of the service.",
    ],
    bullets: [
      "We do not sell or share your personal information with advertisers.",
      "We only request Google permissions necessary for the functionality you choose to use.",
      "We do not read or analyze your Gmail inbox contents for advertising or unrelated processing.",
      "You can revoke Google permissions at any time through your Google Account settings.",
    ],
  },
  {
    id: "information-we-collect",
    title: "Information We Collect",
    body: [
      "We only collect information that is needed to provide the service and improve the experience.",
    ],
    bullets: [
      "Google account information such as your name, email address, and profile picture.",
      "Resume uploads and related career documents you choose to add.",
      "Job applications, job descriptions, and application history you save in JobPilot.",
      "User profile information you provide, including preferences and settings.",
      "Usage analytics and product interaction data used to understand feature usage and improve performance.",
    ],
  },
  {
    id: "how-we-use-information",
    title: "How We Use Information",
    body: [
      "We use the information we collect to operate JobPilot and deliver the functionality you request.",
    ],
    bullets: [
      "Create and manage user accounts and authenticate sign-ins.",
      "Generate AI-powered resumes, cover letters, and application emails.",
      "Send emails on your behalf only when you explicitly choose to send them.",
      "Store application history so you can track your job search progress.",
      "Improve our services, reliability, and product features.",
    ],
  },
  {
    id: "google-api-data-usage",
    title: "Google API Data Usage",
    body: [
      "We request only the Google permissions necessary for application functionality.",
      "Gmail access is used solely to send emails that you explicitly initiate after giving consent.",
      "We do not read, monitor, or analyze your Gmail inbox contents for advertising, profiling, or unrelated processing.",
      "Google user data is never sold or shared with advertisers.",
      "You can revoke Google permissions at any time through your Google Account settings.",
    ],
    bullets: [
      "We do not sell or share your personal information with advertisers.",
      "We only request Google permissions necessary for the functionality you choose to use.",
      "We do not read or analyze your Gmail inbox contents for advertising or unrelated processing.",
      "You can revoke Google permissions at any time through your Google Account settings.",
    ],
  },
  {
    id: "data-storage-security",
    title: "Data Storage & Security",
    body: [
      "We store data using access controls, encryption in transit, and security practices designed to reduce unauthorized access.",
      "Only authorized systems and personnel can access service data when necessary to operate, maintain, or support the platform.",
      "No security system is perfect, but we work continuously to protect your information and review our safeguards regularly.",
    ],
    bullets: [
      "Data is encrypted in transit using HTTPS.",
      "Access to data is restricted to authorized personnel only.",
      "We regularly review and update our security practices to protect against unauthorized access.",
    ],
  },
  {
    id: "third-party-services",
    title: "Third-party Services",
    body: [
      "JobPilot relies on trusted service providers to deliver core functionality. These providers only receive data necessary to perform their roles.",
    ],
    bullets: [
      "Google OAuth for authentication and account linking.",
      "Google Gmail API for user-initiated email sending.",
      "OpenAI or other AI providers for text generation and assistant features.",
      "Cloudinary for media and resume asset storage.",
    ],
  },
  {
    id: "user-rights",
    title: "User Rights",
    body: ["You control your data and can update or remove it as needed."],
    bullets: [
      "Access the data associated with your account.",
      "Update your profile and account information.",
      "Delete your account and associated data.",
      "Revoke Google permissions from your Google Account at any time.",
    ],
  },
  {
    id: "data-retention",
    title: "Data Retention",
    body: [
      "We retain account and application data only for as long as needed to provide the service, comply with legal obligations, resolve disputes, and maintain business records.",
      "When you delete your account, we remove or anonymize stored data according to our retention and deletion procedures.",
    ],
    bullets: [
      "Account and application data is retained only as long as necessary to provide the service.",
      "When you delete your account, we remove or anonymize stored data according to our retention and deletion procedures.",
    ],
  },
  {
    id: "childrens-privacy",
    title: "Children's Privacy",
    body: [
      "JobPilot is not intended for children under 13, and we do not knowingly collect personal information from children under that age.",
    ],
    bullets: [
      "If we learn that we have collected personal information from a child under 13, we will take steps to delete that information promptly.",
    ],
  },
  {
    id: "changes",
    title: "Changes to this Privacy Policy",
    body: [
      "We may update this Privacy Policy from time to time to reflect changes in our services, legal requirements, or security practices.",
      "If we make material changes, we will update the Last Updated date and may provide additional notice where appropriate.",
    ],
    bullets: [
      "We may update this Privacy Policy from time to time to reflect changes in our services, legal requirements, or security practices.",
      "If we make material changes, we will update the Last Updated date and may provide additional notice where appropriate.",
    ],
  },
  {
    id: "contact-information",
    title: "Contact Information",
    body: [
      "If you have questions about this Privacy Policy or our data practices, contact us using the details below.",
    ],
    bullets: [
      "We may update this Privacy Policy from time to time to reflect changes in our services, legal requirements, or security practices.",
      "If we make material changes, we will update the Last Updated date and may provide additional notice where appropriate.",
    ],
    contactLinks: [
      { label: "Contact Us", href: "/contact" },
      { label: "Email support", href: `mailto:${SUPPORT_EMAIL}` },
    ],
  },
] as {
  id: string;
  title: string;
  body: string[];
  bullets?: string[];
  contactLinks?: { label: string; href: string }[];
}[];
