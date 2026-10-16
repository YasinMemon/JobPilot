"use client";

import { motion } from "framer-motion";
import { Check, Sparkles, Zap, Building2 } from "lucide-react";
import Link from "next/link";
import { PRICING_PLANS } from "@/lib/site-config";

const iconMap: Record<string, React.ElementType> = {
  Free: Zap,
  Pro: Sparkles,
  Enterprise: Building2,
};

const colorMap: Record<string, string> = {
  Free: "from-gray-500 to-slate-500",
  Pro: "from-indigo-500 to-violet-600",
  Enterprise: "from-violet-500 to-fuchsia-600",
};

const borderMap: Record<string, string> = {
  Free: "border-white/8",
  Pro: "border-indigo-500/40",
  Enterprise: "border-white/8",
};

const ctaStyleMap: Record<string, string> = {
  Free: "border border-white/10 text-white hover:bg-white/5 transition-colors",
  Pro: "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/25",
  Enterprise:
    "border border-white/10 text-white hover:bg-white/5 transition-colors",
};

export default function Pricing() {
  return (
    <section id="pricing" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-175 h-100 bg-indigo-600/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-medium mb-4">
            ✦ Simple Pricing
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Invest in Your <span className="gradient-text">Career</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Start free, upgrade when you&apos;re ready. No hidden fees, no
            long-term commitment required.
          </p>
        </motion.div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {PRICING_PLANS.map((plan, index) => {
            const Icon = iconMap[plan.name] ?? Zap;
            const color = colorMap[plan.name] ?? "from-gray-500 to-slate-500";
            const borderColor = borderMap[plan.name] ?? "border-white/8";
            const ctaStyle =
              ctaStyleMap[plan.name] ??
              "border border-white/10 text-white hover:bg-white/5 transition-colors";

            return (
              <motion.div
                key={plan.id}
                id={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative rounded-2xl border ${borderColor} overflow-hidden ${
                  plan.highlighted
                    ? "bg-linear-to-b from-indigo-500/10 to-violet-500/5"
                    : "glass-card"
                }`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 flex justify-center">
                    <div className="px-4 py-1 rounded-b-xl bg-linear-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold">
                      ✨ Most Popular
                    </div>
                  </div>
                )}

                {/* Top glow for highlighted */}
                {plan.highlighted && (
                  <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-indigo-500 to-transparent" />
                )}

                <div className="p-6 pt-8">
                  {/* Plan header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className={`w-9 h-9 rounded-xl bg-linear-to-br ${color} flex items-center justify-center`}
                    >
                      <Icon className="w-4.5 h-4.5 text-white" />
                    </div>
                    <h3 className="text-white font-bold text-lg">{plan.name}</h3>
                  </div>

                  <p className="text-gray-400 text-sm mb-5">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mb-5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-white">
                        {plan.price}
                      </span>
                      {plan.price !== "Custom" && (
                        <span className="text-gray-500 text-sm">
                          /{plan.period}
                        </span>
                      )}
                    </div>
                    {plan.price === "Custom" && (
                      <p className="text-gray-500 text-sm">{plan.period}</p>
                    )}
                  </div>

                  {/* CTA */}
                  <Link
                    href={plan.ctaHref}
                    className={`block w-full py-3 rounded-xl font-semibold text-sm mb-6 text-center ${ctaStyle}`}
                  >
                    {plan.ctaText}
                  </Link>

                  {/* Divider */}
                  <div className="border-t border-white/5 mb-5" />

                  {/* Features */}
                  <ul className="space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-full bg-linear-to-br ${color} flex items-center justify-center shrink-0`}
                        >
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                        <span
                          className={`text-sm ${plan.highlighted ? "text-gray-200" : "text-gray-400"}`}
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Money-back note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center text-gray-500 text-sm mt-8"
        >
          ✅ 7-day free trial on Pro &nbsp;·&nbsp; No credit card required to
          start &nbsp;·&nbsp; Cancel anytime
        </motion.p>
      </div>
    </section>
  );
}
