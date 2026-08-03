"use client";

import { motion } from "framer-motion";

const companies = [
  { name: "Google", letter: "G", colors: "from-blue-500 to-green-500" },
  { name: "Microsoft", letter: "M", colors: "from-blue-600 to-cyan-500" },
  { name: "Amazon", letter: "A", colors: "from-orange-500 to-amber-500" },
  { name: "Adobe", letter: "Ad", colors: "from-red-600 to-rose-500" },
  { name: "Meta", letter: "f", colors: "from-blue-500 to-indigo-600" },
  { name: "Netflix", letter: "N", colors: "from-red-600 to-red-700" },
];

export default function TrustedBy() {
  return (
    <section id="trusted-by" className="relative py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <p className="text-gray-500 text-sm font-medium uppercase tracking-widest">
            Trusted by professionals from
          </p>
          <p className="text-gray-600 text-xs mt-1">
            * Logo placeholders for demonstration purposes
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-8 md:gap-12"
        >
          {companies.map((company, i) => (
            <motion.div
              key={company.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="flex items-center gap-3 group cursor-default"
            >
              <div
                className={`w-9 h-9 rounded-xl bg-linear-to-br ${company.colors} flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 transition-transform duration-200`}
              >
                {company.letter}
              </div>
              <span className="text-gray-400 font-semibold text-lg group-hover:text-white transition-colors duration-200">
                {company.name}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Divider line */}
        <div className="mt-12 border-t border-white/5" />
      </div>
    </section>
  );
}
