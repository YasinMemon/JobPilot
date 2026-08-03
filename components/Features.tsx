"use client";

import { motion } from "framer-motion";
import {
  Mail,
  FileText,
  LayoutDashboard,
  Mic,
  Lightbulb,
  BarChart3,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    id: "email-generator",
    icon: Mail,
    title: "AI Email Generator",
    description:
      "Generate personalized, ATS-optimized application emails instantly from any job description. Tailored to your experience.",
    color: "from-indigo-500 to-violet-500",
    glow: "shadow-indigo-500/20",
    tag: "Most Popular",
  },
  {
    id: "resume-analyzer",
    icon: FileText,
    title: "Resume Analyzer",
    description:
      "Deep AI analysis of your resume against job requirements. Get ATS score improvements and targeted recommendations.",
    color: "from-violet-500 to-fuchsia-500",
    glow: "shadow-violet-500/20",
    tag: null,
  },
  {
    id: "job-tracker",
    icon: BarChart3,
    title: "Job Tracker",
    description:
      "Track every application in one centralized dashboard. Status updates, deadlines, and follow-up reminders built-in.",
    color: "from-cyan-500 to-blue-500",
    glow: "shadow-cyan-500/20",
    tag: null,
  },
  {
    id: "interview-prep",
    icon: Mic,
    title: "Interview Preparation",
    description:
      "AI-generated role-specific interview questions with model answers. Practice mode with instant feedback.",
    color: "from-emerald-500 to-teal-500",
    glow: "shadow-emerald-500/20",
    tag: "New",
  },
  {
    id: "smart-dashboard",
    icon: LayoutDashboard,
    title: "Smart Dashboard",
    description:
      "Manage your entire job search efficiently from one beautiful, intelligent command center.",
    color: "from-orange-500 to-amber-500",
    glow: "shadow-orange-500/20",
    tag: null,
  },
  {
    id: "ai-suggestions",
    icon: Lightbulb,
    title: "AI Career Suggestions",
    description:
      "Receive personalized career guidance, skill gap analysis, and curated job recommendations powered by AI.",
    color: "from-pink-500 to-rose-500",
    glow: "shadow-pink-500/20",
    tag: null,
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Features() {
  return (
    <section id="features" className="relative py-24 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-indigo-600/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-medium mb-4">
            ✦ Everything You Need
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Supercharge Your <span className="gradient-text">Job Search</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Every tool you need to land your dream job, powered by cutting-edge
            AI — all in one platform.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.id}
              id={feature.id}
              variants={cardVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group relative glass-card rounded-2xl p-6 cursor-default overflow-hidden"
            >
              {/* Hover gradient overlay */}
              <div
                className={`absolute inset-0 bg-linear-to-br ${feature.color} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300 rounded-2xl`}
              />

              {/* Top border glow on hover */}
              <div
                className={`absolute top-0 left-6 right-6 h-px bg-linear-to-r ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />

              <div className="relative z-10">
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl bg-linear-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg ${feature.glow} group-hover:scale-110 transition-transform duration-200`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>

                {/* Tag + Title */}
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-white font-semibold text-lg">
                    {feature.title}
                  </h3>
                  {feature.tag && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium bg-linear-to-r ${feature.color} text-white`}
                    >
                      {feature.tag}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  {feature.description}
                </p>

                {/* Learn more */}
                <div className="flex items-center gap-1 text-indigo-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  Learn more
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
