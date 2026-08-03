import Hero from "@/components/Hero";
import TrustedBy from "@/components/TrustedBy";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import DashboardPreview from "@/components/DashboardPreview";
import Comparison from "@/components/Comparison";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="bg-[#09090b] overflow-x-hidden">
      <Hero />
      <TrustedBy />
      <Features />
      <HowItWorks />
      <DashboardPreview />
      <Comparison />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
