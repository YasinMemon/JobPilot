/**
 * Central site configuration for JobPilot.
 * Keep all public-facing constants here so changes propagate everywhere.
 */

// ---------------------------------------------------------------------------
// Domain & contact
// ---------------------------------------------------------------------------
export const SITE_URL = "https://jobpilot.cc";

/**
 * Support email address.
 * Override with NEXT_PUBLIC_SUPPORT_EMAIL env var in production if needed.
 */
export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "memonyasin2007@gmail.com";

// ---------------------------------------------------------------------------
// Pricing plans – single source of truth
// ---------------------------------------------------------------------------
export type PricingPlan = {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  ctaText: string;
  /** Route for the CTA button */
  ctaHref: string;
  features: string[];
  popular?: boolean;
  highlighted?: boolean;
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "plan-free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started with AI-powered job applications.",
    ctaText: "Get Started Free",
    ctaHref: "/register",
    features: [
      "5 AI email generations / month",
      "Basic resume analysis",
      "Track up to 10 applications",
      "1 interview prep session",
      "Email support",
      "JobPilot branding",
    ],
  },
  {
    id: "plan-pro",
    name: "Pro",
    price: "$19",
    period: "per month",
    description: "For serious job seekers who want every advantage possible.",
    ctaText: "Start Pro — 7-Day Free Trial",
    ctaHref: "/register?plan=pro",
    features: [
      "Unlimited AI email generations",
      "Advanced resume analyzer + ATS score",
      "Unlimited application tracking",
      "Unlimited interview prep",
      "AI career suggestions",
      "Smart follow-up reminders",
      "Priority support",
      "No branding",
    ],
    popular: true,
    highlighted: true,
  },
  {
    id: "plan-enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "per team",
    description: "For teams, universities, and career centers at scale.",
    ctaText: "Contact Sales",
    ctaHref: "/contact",
    features: [
      "Everything in Pro",
      "Team dashboard & analytics",
      "Bulk application management",
      "Custom AI training",
      "API access",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
    ],
  },
];
