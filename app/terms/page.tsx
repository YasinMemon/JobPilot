import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import Footer from "@/components/Footer";
import PageHero from "@/components/site/PageHero";
import SectionCard from "@/components/site/SectionCard";

export const metadata: Metadata = {
  title: "Terms of Service | JobPilot",
  description:
    "Terms of Service for JobPilot. This placeholder page will be expanded as the product policies are finalized.",
};

export default function TermsPage() {
  return (
    <main className="bg-[#09090b]">
      <PageHero
        eyebrow="Legal Notice"
        title="Terms of Service"
        description="This placeholder page is provided so visitors can find a public terms link while the final legal text is being completed."
        actions={[{ label: "Contact Us", href: "/contact" }]}
      >
        <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
          <FileText className="size-4 text-indigo-300" />
          Terms content coming soon.
        </div>
      </PageHero>

      <div className="mx-auto max-w-4xl px-6 py-14 sm:py-16">
        <SectionCard title="Placeholder Notice" eyebrow="01">
          <p>
            JobPilot is still finalizing its legal terms. For now, this page exists as a public placeholder referenced from the privacy policy and footer.
          </p>
          <p>
            If you need help right away, use the support form or email our team directly.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(99,102,241,0.24)] transition hover:brightness-110"
          >
            Contact Support
            <ArrowRight className="size-4" />
          </Link>
        </SectionCard>
      </div>

      <Footer />
    </main>
  );
}
