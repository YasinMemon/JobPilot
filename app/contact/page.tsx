import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock3, Mail, MessageCircleMore, PhoneCall, ShieldCheck, Globe } from "lucide-react";
import Footer from "@/components/Footer";
import PageHero from "@/components/site/PageHero";
import ContactForm from "@/components/contact/ContactForm";
import {
  CONTACT_BUSINESS_HOURS,
  CONTACT_FAQS,
  CONTACT_RESPONSE_TIME,
  CONTACT_SOCIAL_LINKS,
  CONTACT_SUPPORT_EMAIL,
} from "@/lib/public-content";

export const metadata: Metadata = {
  title: "Contact Us | JobPilot",
  description:
    "Need help with JobPilot? Contact our support team for technical assistance, account issues, feature requests, or general inquiries.",
  openGraph: {
    title: "Contact Us | JobPilot",
    description:
      "Need help with JobPilot? Contact our support team for technical assistance, account issues, feature requests, or general inquiries.",
    type: "website",
    url: "/contact",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us | JobPilot",
    description:
      "Need help with JobPilot? Contact our support team for technical assistance, account issues, feature requests, or general inquiries.",
  },
};

export default function ContactPage() {
  return (
    <main className="bg-[#09090b]">
      <PageHero
        eyebrow="Support Center"
        title="Contact Us"
        description="Reach out with product questions, account issues, billing concerns, bug reports, or feature requests. We will route your message to the right place."
        actions={[
          { label: "Email Support", href: `mailto:${CONTACT_SUPPORT_EMAIL}` },
          { label: "Privacy Policy", href: "/privacy-policy", variant: "secondary" },
        ]}
      >
        <div className="flex flex-wrap gap-3 text-sm text-slate-300">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <Clock3 className="size-4 text-indigo-300" />
            Reply time: <span className="font-medium text-white">{CONTACT_RESPONSE_TIME}</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <ShieldCheck className="size-4 text-emerald-300" />
            Secure support routing
          </div>
        </div>
      </PageHero>

      <div className="mx-auto max-w-7xl px-6 py-14 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <section className="rounded-3xl border border-white/10 bg-white/4 p-6 shadow-[0_18px_70px_rgba(0,0,0,0.22)] backdrop-blur sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Send a Message
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Fill out the form below and we will respond as soon as possible.
              </p>
            </div>
            <ContactForm />
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/4 p-6 backdrop-blur">
              <div className="flex items-center gap-2 text-lg font-semibold text-white">
                <Mail className="size-4 text-indigo-300" />
                Contact Information
              </div>
              <div className="mt-4 space-y-4 text-sm leading-6 text-slate-300">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Email</p>
                  <a className="mt-1 inline-flex text-white transition hover:text-indigo-300" href={`mailto:${CONTACT_SUPPORT_EMAIL}`}>
                    {CONTACT_SUPPORT_EMAIL}
                  </a>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Business Hours</p>
                  <p className="mt-1 text-white">{CONTACT_BUSINESS_HOURS[0]}</p>
                  <p>{CONTACT_BUSINESS_HOURS[1]}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Response Time</p>
                  <p className="mt-1 text-white">{CONTACT_RESPONSE_TIME}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/4 p-6 backdrop-blur">
              <div className="flex items-center gap-2 text-lg font-semibold text-white">
                <MessageCircleMore className="size-4 text-indigo-300" />
                FAQ
              </div>
              <div className="mt-4 space-y-4">
                {CONTACT_FAQS.map((faq) => (
                  <div key={faq.question} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                    <h3 className="text-sm font-semibold text-white">{faq.question}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/4 p-6 backdrop-blur">
              <div className="flex items-center gap-2 text-lg font-semibold text-white">
                <Globe className="size-4 text-indigo-300" />
                Social Links
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {CONTACT_SOCIAL_LINKS.map((social) => (
                  <Link
                    key={social.label}
                    href={social.href}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
                  >
                    {social.label}
                    <ArrowRight className="size-4" />
                  </Link>
                ))}
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-400">
                Social profiles are placeholders for now. For the fastest response, use the form or email above.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/4 p-6 backdrop-blur">
              <div className="flex items-center gap-2 text-lg font-semibold text-white">
                <PhoneCall className="size-4 text-indigo-300" />
                Need a faster path?
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Include your account email, what you were trying to do, and any error details so we can triage your request quickly.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </main>
  );
}
