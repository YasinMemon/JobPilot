import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Mail } from "lucide-react";
import Footer from "@/components/Footer";
import PageHero from "@/components/site/PageHero";
import SectionCard from "@/components/site/SectionCard";
import {
  PRIVACY_POLICY_LAST_UPDATED,
  PRIVACY_POLICY_LINKS,
  PRIVACY_POLICY_SECTIONS,
} from "@/lib/public-content";

export const metadata: Metadata = {
  title: "Privacy Policy | JobPilot",
  description:
    "Learn how JobPilot collects, stores, and protects your information while using Google authentication, Gmail integration, and AI-powered career tools.",
  openGraph: {
    title: "Privacy Policy | JobPilot",
    description:
      "Learn how JobPilot collects, stores, and protects your information while using Google authentication, Gmail integration, and AI-powered career tools.",
    type: "website",
    url: "/privacy-policy",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | JobPilot",
    description:
      "Learn how JobPilot collects, stores, and protects your information while using Google authentication, Gmail integration, and AI-powered career tools.",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="bg-[#09090b]">
      <PageHero
        eyebrow="Privacy & Trust"
        title="Privacy Policy"
        description="This policy explains the information JobPilot collects, how we use it, and the controls you have over your account and Google permissions."
        actions={PRIVACY_POLICY_LINKS.map((link) => ({
          label: link.label,
          href: link.href,
          variant: link.label === "Terms of Service" ? "secondary" : "primary",
        }))}
      >
        <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
          <ShieldCheck className="size-4 text-emerald-300" />
          Last Updated:{" "}
          <span className="font-medium text-white">
            {PRIVACY_POLICY_LAST_UPDATED}
          </span>
        </div>
      </PageHero>

      <div className="mx-auto max-w-7xl space-y-6 px-6 py-14 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-6">
            {PRIVACY_POLICY_SECTIONS.map((section, index) => (
              <SectionCard
                key={section.id}
                id={section.id}
                title={section.title}
                eyebrow={`${String(index + 1).padStart(2, "0")}`}
              >
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.bullets ? (
                  <ul className="space-y-3">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-3">
                        <span className="mt-2 h-2 w-2 rounded-full bg-indigo-400" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {section &&
                section.contactLinks &&
                section.contactLinks.length > 0 ? (
                  <div className="mt-6 space-y-3">
                    {section.contactLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(99,102,241,0.24)] transition hover:brightness-110"
                      >
                        {link.label}
                        <ArrowRight className="size-4" />
                      </Link>
                    ))}
                  </div>
                ) : null}
              </SectionCard>
            ))}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Mail className="size-4 text-indigo-300" />
                Quick Contact
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Questions about privacy, Google permissions, or account deletion
                can be sent directly to our support team.
              </p>
              <Link
                href="/contact"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(99,102,241,0.24)] transition hover:brightness-110"
              >
                Contact Support
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
              <h2 className="text-lg font-semibold text-white">
                Policy Highlights
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                <li>
                  Google permissions are requested only when needed for app
                  functionality.
                </li>
                <li>
                  Emails are sent only when you explicitly choose to send them.
                </li>
                <li>We never read, monitor, or analyze your Gmail inbox.</li>
                <li>
                  Google user data is not sold or shared with advertisers.
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </main>
  );
}
