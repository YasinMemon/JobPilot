"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  FileText,
  Calendar,
  Lightbulb,
  TrendingUp,
  Bell,
} from "lucide-react";

export default function DashboardPreview() {
  return (
    <section id="dashboard" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-px bg-linear-to-r from-transparent via-indigo-500/30 to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-200 h-px bg-linear-to-r from-transparent via-violet-500/30 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-sm font-medium mb-4">
            ✦ Your Command Center
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Everything in One <span className="gradient-text">Dashboard</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            A beautifully designed, intelligent dashboard that puts your entire
            job search at your fingertips.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-linear-to-r from-indigo-600/15 via-violet-600/15 to-fuchsia-600/15 blur-3xl rounded-3xl" />

          <div className="relative glass-card rounded-2xl border border-white/10 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-slate-900/80">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              </div>
              <div className="flex-1 max-w-xs mx-auto">
                <div className="bg-slate-900/80 rounded-md px-3 py-1 text-xs text-gray-500 text-center">
                  jobpilot.cc/dashboard
                </div>
              </div>
              <span className="text-[10px] text-gray-600 border border-white/10 px-2 py-0.5 rounded-full">
                Sample data
              </span>
            </div>

            <div className="flex">
              <div className="w-48 border-r border-white/5 p-4 hidden md:block bg-slate-900/80">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-6 h-6 rounded-md bg-linear-to-br from-indigo-500 to-violet-600" />
                  <span className="text-white text-sm font-bold">JobPilot</span>
                </div>
                {[
                  { icon: BarChart3, label: "Dashboard", active: true },
                  { icon: FileText, label: "Applications", active: false },
                  { icon: Calendar, label: "Interviews", active: false },
                  { icon: Lightbulb, label: "AI Suggestions", active: false },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-1 text-sm cursor-default transition-colors ${
                      item.active
                        ? "bg-indigo-500/20 text-indigo-300"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </div>
                ))}
              </div>

              <div className="min-w-0 flex-1 p-4 sm:p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-white font-bold text-lg">
                      Your Dashboard 👋
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Sample data for illustration
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-medium">
                      + New Application
                    </div>
                    <div className="w-9 h-9 rounded-full bg-linear-to-br from-indigo-500 to-violet-600" />
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    [
                      "Total Applications",
                      "24",
                      "text-indigo-400",
                      BarChart3,
                      "from-indigo-500 to-violet-500",
                    ],
                    [
                      "Resume Score",
                      "92%",
                      "text-emerald-400",
                      TrendingUp,
                      "from-emerald-500 to-teal-500",
                    ],
                    [
                      "Interviews",
                      "6",
                      "text-violet-400",
                      Calendar,
                      "from-violet-500 to-fuchsia-500",
                    ],
                    [
                      "AI Suggestions",
                      "18",
                      "text-amber-400",
                      Lightbulb,
                      "from-amber-500 to-orange-500",
                    ],
                  ].map(([label, value, textColor, Icon, color]) => (
                    <div
                      key={label as string}
                      className="bg-slate-900/80 rounded-xl p-4 border border-white/5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`w-8 h-8 rounded-lg bg-linear-to-br ${color as string} flex items-center justify-center`}
                        >
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <p
                        className={`text-2xl font-bold ${textColor as string}`}
                      >
                        {value as string}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {label as string}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-3">
                  <div className="lg:col-span-2 bg-slate-900/80 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-white text-sm font-semibold">
                        Recent Applications
                      </p>
                      <span className="text-indigo-400 text-xs cursor-pointer hover:text-indigo-300">
                        View All →
                      </span>
                    </div>
                    <div className="space-y-2">
                      {[
                        [
                          "Google",
                          "Software Engineer II",
                          "Jul 5",
                          "Interview Scheduled",
                          "text-emerald-400",
                          "bg-emerald-400",
                        ],
                        [
                          "Stripe",
                          "Frontend Engineer",
                          "Jul 3",
                          "Application Reviewed",
                          "text-amber-400",
                          "bg-amber-400",
                        ],
                        [
                          "Vercel",
                          "Full Stack Developer",
                          "Jul 2",
                          "Screening Call",
                          "text-indigo-400",
                          "bg-indigo-400",
                        ],
                        [
                          "OpenAI",
                          "AI Engineer",
                          "Jun 28",
                          "Under Review",
                          "text-cyan-400",
                          "bg-cyan-400",
                        ],
                      ].map(
                        ([company, role, date, status, statusColor, dot]) => (
                          <div
                            key={company as string}
                            className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-white">
                                {(company as string)[0]}
                              </div>
                              <div>
                                <p className="text-white text-xs font-medium">
                                  {company as string}
                                </p>
                                <p className="text-gray-500 text-xs">
                                  {role as string}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1.5">
                                <div
                                  className={`w-1.5 h-1.5 rounded-full ${dot as string}`}
                                />
                                <span
                                  className={`text-xs ${statusColor as string}`}
                                >
                                  {status as string}
                                </span>
                              </div>
                              <p className="text-gray-600 text-xs">
                                {date as string}
                              </p>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="bg-linear-to-b from-indigo-500/10 to-violet-500/5 rounded-xl p-4 border border-indigo-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-md bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                        <Lightbulb className="w-3 h-3 text-white" />
                      </div>
                      <p className="text-white text-sm font-semibold">
                        AI Insights
                      </p>
                    </div>
                    <div className="space-y-3">
                      {[
                        "Your TypeScript skills match 89% of your target roles.",
                        "Add AWS certification to boost match rate by 22%.",
                        "Best time to apply: Tuesday-Thursday mornings.",
                      ].map((tip, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-lg bg-white/5 border border-white/5"
                        >
                          <p className="text-xs text-gray-300 leading-relaxed">
                            {tip}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -right-4 top-1/4 hidden xl:block">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="glass-card rounded-xl p-3 border border-white/10 shadow-lg"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-linear-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-white text-xs font-medium">Resume Score</p>
                  <p className="text-emerald-400 text-xs">92% — Excellent!</p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="absolute -left-4 bottom-1/4 hidden xl:block">
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
              className="glass-card rounded-xl p-3 border border-white/10 shadow-lg"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <Bell className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-white text-xs font-medium">
                    Interview Alert
                  </p>
                  <p className="text-indigo-400 text-xs">
                    Google • Tomorrow 10am
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
