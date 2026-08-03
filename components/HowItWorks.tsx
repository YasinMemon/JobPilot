"use client";

import { motion } from "framer-motion";
import { ClipboardList, Sparkles, Rocket, ArrowDown } from "lucide-react";

const steps = [
  {
    id: "step-paste",
    number: "01",
    icon: ClipboardList,
    title: "Paste Job Description",
    description:
      "Simply copy and paste any job description from LinkedIn, Indeed, or any company website into JobPilot.",
    color: "from-indigo-500 to-violet-500",
    glowColor: "rgba(99, 102, 241, 0.3)",
    details: ["Supports any job board", "Auto-extracts key requirements", "One click to paste"],
  },
  {
    id: "step-generate",
    number: "02",
    icon: Sparkles,
    title: "AI Generates Email + Suggestions",
    description:
      "Our AI instantly crafts a tailored application email, analyzes your resume fit, and provides interview tips.",
    color: "from-violet-500 to-fuchsia-500",
    glowColor: "rgba(139, 92, 246, 0.3)",
    details: ["Personalized email in seconds", "Resume match analysis", "Interview tips included"],
  },
  {
    id: "step-apply",
    number: "03",
    icon: Rocket,
    title: "Apply with Confidence",
    description:
      "Review, customize if needed, then send your polished application. Track its status directly in your dashboard.",
    color: "from-emerald-500 to-teal-500",
    glowColor: "rgba(16, 185, 129, 0.3)",
    details: ["One-click apply", "Application auto-tracked", "Follow-up reminders"],
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-0 top-1/3 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-medium mb-4">
            ✦ Simple Process
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            How <span className="gradient-text">JobPilot</span> Works
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            From job description to submitted application in under 60 seconds.
            It really is that simple.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-linear-to-b from-indigo-500/0 via-indigo-500/30 to-indigo-500/0 hidden lg:block -translate-x-1/2" />

          <div className="space-y-12 lg:space-y-0">
            {steps.map((step, index) => (
              <div key={step.id} id={step.id}>
                {/* Down arrow between steps */}
                {index < steps.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="flex justify-center my-6 lg:hidden"
                  >
                      <div className="w-8 h-8 rounded-full bg-slate-900/80 border border-white/10 flex items-center justify-center">
                      <ArrowDown className="w-4 h-4 text-indigo-400" />
                    </div>
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  className={`grid lg:grid-cols-2 gap-8 items-center mb-16 ${
                    index % 2 === 1 ? "lg:[direction:rtl]" : ""
                  }`}
                >
                  {/* Text */}
                  <div
                    className={`${index % 2 === 1 ? "lg:[direction:ltr]" : ""}`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span
                        className={`text-5xl font-black bg-linear-to-br ${step.color} bg-clip-text text-transparent`}
                      >
                        {step.number}
                      </span>
                      <div className="h-px flex-1 bg-linear-to-r from-white/10 to-transparent" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-400 text-lg leading-relaxed mb-6">
                      {step.description}
                    </p>
                    <ul className="space-y-2">
                      {step.details.map((detail) => (
                        <li
                          key={detail}
                          className="flex items-center gap-2 text-gray-300 text-sm"
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-linear-to-br ${step.color} flex items-center justify-center shrink-0`}
                          >
                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                          </div>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Illustration Card */}
                  <div
                    className={`${index % 2 === 1 ? "lg:[direction:ltr]" : ""} relative`}
                  >
                    <div
                      className="absolute inset-0 rounded-2xl blur-2xl"
                      style={{ background: step.glowColor, opacity: 0.2 }}
                    />
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                      className="relative glass-card rounded-2xl p-6 overflow-hidden"
                    >
                      {/* Step illustration */}
                      <div
                        className={`w-14 h-14 rounded-2xl bg-linear-to-br ${step.color} flex items-center justify-center mb-4 shadow-lg`}
                        style={{ boxShadow: `0 8px 32px ${step.glowColor}` }}
                      >
                        <step.icon className="w-7 h-7 text-white" />
                      </div>

                      {/* Step-specific mock UI */}
                      {index === 0 && (
                        <div className="space-y-3">
                          <p className="text-white text-sm font-medium">
                            Job Description
                          </p>
                          <div className="bg-slate-900/80 rounded-xl p-3 border border-white/10">
                            <p className="text-gray-400 text-xs leading-relaxed">
                              We are looking for a skilled Software Engineer to
                              join our team. You will be working on cutting-edge
                              AI products...
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <div className="px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs">
                              React
                            </div>
                            <div className="px-3 py-1 rounded-lg bg-violet-500/20 text-violet-300 text-xs">
                              TypeScript
                            </div>
                            <div className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs">
                              Node.js
                            </div>
                          </div>
                          <button className="w-full py-2 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium">
                            Analyze with AI →
                          </button>
                        </div>
                      )}

                      {index === 1 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                            <p className="text-indigo-300 text-xs">
                              AI is generating your email...
                            </p>
                          </div>
                          <div className="bg-slate-900/80 rounded-xl p-3 border border-indigo-500/20">
                            <p className="text-gray-300 text-xs leading-relaxed">
                              Dear Hiring Manager,
                              <br />
                              <br />I am excited to apply for the Software
                              Engineer position at your organization...
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-emerald-500/10 rounded-lg p-2 border border-emerald-500/20 text-center">
                              <p className="text-emerald-400 text-sm font-bold">
                                94%
                              </p>
                              <p className="text-gray-500 text-xs">ATS Match</p>
                            </div>
                            <div className="bg-indigo-500/10 rounded-lg p-2 border border-indigo-500/20 text-center">
                              <p className="text-indigo-400 text-sm font-bold">
                                12
                              </p>
                              <p className="text-gray-500 text-xs">Tips</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {index === 2 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-white text-sm font-medium">
                              Application Sent ✓
                            </p>
                            <div className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
                              Tracked
                            </div>
                          </div>
                          <div className="space-y-2">
                            {[
                              {
                                label: "Email Delivered",
                                done: true,
                                color: "bg-emerald-400",
                              },
                              {
                                label: "Application Saved",
                                done: true,
                                color: "bg-emerald-400",
                              },
                              {
                                label: "Follow-up Reminder Set",
                                done: true,
                                color: "bg-emerald-400",
                              },
                              {
                                label: "Waiting for Response",
                                done: false,
                                color: "bg-amber-400",
                              },
                            ].map((item) => (
                              <div
                                key={item.label}
                                className="flex items-center gap-2"
                              >
                                <div
                                  className={`w-3 h-3 rounded-full ${item.done ? item.color : "bg-white/20"}`}
                                />
                                <p
                                  className={`text-xs ${item.done ? "text-gray-300" : "text-gray-500"}`}
                                >
                                  {item.label}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
