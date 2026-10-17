"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

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
            Apply smarter, get more interviews, and manage your entire job
            search — all in one AI-powered platform.
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href="/register"
                id="cta-start-free"
                className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-lg rounded-xl shadow-2xl shadow-indigo-500/30 hover:opacity-95 transition-opacity"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>

          {/* Early access note */}
          <p className="text-gray-500 text-sm">
            JobPilot is free while in early access.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
