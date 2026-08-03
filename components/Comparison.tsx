"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

const comparisons = [
  ["Manual, generic emails", "AI-generated personalized emails"],
  ["Chaotic spreadsheet tracking", "Smart, auto-updating dashboard"],
  ["No resume feedback", "AI resume review + ATS scoring"],
  ["Guessing interview questions", "AI-generated role-specific prep"],
  ["No follow-up reminders", "Automated smart follow-up alerts"],
  ["Applying blindly", "Personalized career AI guidance"],
];

export default function Comparison() {
  return (
    <section id="why-jobpilot" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm font-medium mb-4">
            ✦ Why Choose JobPilot
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            The Old Way vs. <span className="gradient-text">The Smart Way</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Stop wasting time on manual job applications. Let AI do the heavy lifting so you can focus on what matters.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="space-y-3"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card rounded-xl p-4 border border-white/8 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                  <X className="w-3 h-3 text-red-400" />
                </div>
                <span className="text-gray-300 font-semibold">Traditional Job Search</span>
              </div>
            </div>
            <div className="glass-card rounded-xl p-4 border border-indigo-500/30 bg-indigo-500/10 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <Check className="w-3 h-3 text-indigo-400" />
                </div>
                <span className="text-white font-semibold">JobPilot</span>
              </div>
            </div>
          </div>

          {comparisons.map(([traditional, smart], index) => (
            <div key={index} className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 glass-card rounded-xl border border-red-500/10 transition-colors hover:border-red-500/20">
                <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                  <X className="w-2.5 h-2.5 text-red-400" />
                </div>
                <p className="text-gray-400 text-sm">{traditional}</p>
              </div>

              <div className="flex items-center gap-3 p-4 glass-card rounded-xl border border-emerald-500/15 bg-emerald-500/10 transition-colors hover:border-emerald-500/30">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                </div>
                <p className="text-white text-sm font-medium">{smart}</p>
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-12"
        >
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 px-8 py-4 bg-linear-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-indigo-500/25"
          >
            Get Started Free — It&apos;s Time to Apply Smarter
          </a>
        </motion.div>
      </div>
    </section>
  );
}
