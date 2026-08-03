"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";

export default function CTA() {
  return (
    <section id="cta" className="relative py-24 overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[200px] bg-violet-600/20 rounded-full blur-2xl" />
      </div>

      {/* Grid */}
      <div className="absolute inset-0 grid-pattern opacity-20" />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-medium mb-8">
            🚀 Start Your Journey Today
          </div>

          {/* Heading */}
          <h2 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6">
            Ready to Land Your
            <br />
            <span className="gradient-text">Next Job?</span>
          </h2>

          <p className="text-gray-400 text-xl leading-relaxed max-w-2xl mx-auto mb-10">
            Join 2,400+ job seekers who are applying smarter, getting more
            interviews, and landing their dream roles — all with the power of
            AI.
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
            <motion.a
              href="/app"
              id="cta-start-free"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-lg rounded-xl shadow-2xl shadow-indigo-500/30 hover:opacity-95 transition-opacity"
            >
              Start Free — No Credit Card
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.a>

            <motion.button
              id="cta-view-demo"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="group inline-flex items-center gap-2 px-8 py-4 border border-white/10 text-white font-bold text-lg rounded-xl hover:bg-white/5 transition-colors glass-card"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/30 transition-colors">
                <Play className="w-3.5 h-3.5 text-indigo-400 ml-0.5" />
              </div>
              View Demo
            </motion.button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-gray-500 text-sm">
            <span className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              Free plan forever
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-indigo-400" />
              </div>
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-violet-500/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-violet-400" />
              </div>
              Setup in 2 minutes
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
              </div>
              Cancel anytime
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
