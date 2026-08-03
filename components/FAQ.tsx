"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    id: "faq-what-is",
    question: "What is JobPilot and how does it work?",
    answer:
      "JobPilot is an AI-powered job application platform that helps you generate personalized application emails, optimize your resume for ATS systems, track all your applications, and prepare for interviews. Simply paste a job description, and our AI does the rest — analyzing requirements, generating a tailored email, and providing smart suggestions.",
  },
  {
    id: "faq-free-trial",
    question: "Is there a free plan? Do I need a credit card?",
    answer:
      "Yes! JobPilot has a generous free tier that includes 5 AI email generations per month, basic resume analysis, and tracking for up to 10 applications. You don't need a credit card to sign up. The Pro plan includes a 7-day free trial — again, no credit card required to start.",
  },
  {
    id: "faq-ats",
    question: "How does the resume ATS optimization work?",
    answer:
      "Our AI analyzes your resume against the job description you provide and identifies keyword gaps, formatting issues, and missing skills that ATS systems look for. It provides a score from 0-100 and gives you specific, actionable recommendations to improve your ATS match rate — often increasing it by 30-50%.",
  },
  {
    id: "faq-ai-emails",
    question: "Are the AI-generated emails actually personalized?",
    answer:
      "Absolutely. Our AI doesn't use generic templates. It analyzes the specific job description, your resume and experience, and the company's tone to generate a unique, personalized email that highlights your most relevant qualifications. Each email is different and tailored to the specific role and company.",
  },
  {
    id: "faq-interview",
    question: "How does the interview preparation feature work?",
    answer:
      "Based on the job description and your profile, our AI generates role-specific interview questions — including behavioral, technical, and situational questions. It also provides model answers and tips for each question. You can practice in our guided mode and receive instant AI feedback on your responses.",
  },
  {
    id: "faq-data",
    question: "Is my resume and personal data safe with JobPilot?",
    answer:
      "Your privacy and data security are our top priority. All data is encrypted in transit and at rest. We never sell or share your personal information with third parties. Your resume data is only used to generate your personalized content and is never shared with employers directly. You can delete your account and all associated data at any time.",
  },
  {
    id: "faq-cancel",
    question: "Can I cancel my subscription at any time?",
    answer:
      "Yes, absolutely. You can cancel your Pro or Enterprise subscription at any time from your account settings with no penalties or cancellation fees. You'll continue to have access to Pro features until the end of your current billing period, then you'll be downgraded to the Free plan.",
  },
  {
    id: "faq-enterprise",
    question: "Do you offer plans for universities and career centers?",
    answer:
      "Yes! Our Enterprise plan is designed for teams, universities, bootcamps, and career centers who want to provide JobPilot to multiple students or employees. It includes a team dashboard, bulk management tools, custom AI training, API access, and a dedicated account manager. Contact our sales team for custom pricing.",
  },
];

function FAQItem({
  faq,
  isOpen,
  onToggle,
}: {
  faq: (typeof faqs)[0];
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      initial={false}
      className="border border-white/8 rounded-xl overflow-hidden glass-card"
    >
      <button
        id={faq.id}
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left group"
        aria-expanded={isOpen}
      >
        <span
          className={`font-medium text-sm pr-4 transition-colors ${isOpen ? "text-white" : "text-gray-300 group-hover:text-white"}`}
        >
          {faq.question}
        </span>
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
            isOpen
              ? "bg-indigo-500 text-white"
              : "bg-white/5 text-gray-400 group-hover:bg-white/10"
          }`}
        >
          {isOpen ? (
            <Minus className="w-3.5 h-3.5" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <div className="px-5 pb-5 border-t border-white/5">
              <p className="text-gray-400 text-sm leading-relaxed pt-4">
                {faq.answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute left-1/4 top-1/4 w-64 h-64 bg-indigo-600/8 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-medium mb-4">
            ✦ Common Questions
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Everything you need to know about JobPilot.
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-3"
        >
          {faqs.map((faq, index) => (
            <FAQItem
              key={faq.id}
              faq={faq}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </motion.div>

        {/* Contact note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center text-gray-500 text-sm mt-10"
        >
          Still have questions?{" "}
          <a
            href="mailto:support@jobpilot.ai"
            className="text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Chat with our support team →
          </a>
        </motion.p>
      </div>
    </section>
  );
}
