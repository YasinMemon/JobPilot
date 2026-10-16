"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  Mail,
  BarChart3,
  Target,
} from "lucide-react";
import Link from "next/link";

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Animated Background Grid */}
      <div className="absolute inset-0 grid-pattern opacity-40" />

      {/* Animated Gradient Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="animate-blob animation-delay-2000 absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="animate-blob animation-delay-4000 absolute top-1/2 -right-32 w-80 h-80 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="animate-blob absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-indigo-500/15 blur-3xl" />
      </div>

      {/* Navbar */}
      <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2"
        >
          <Link href="/" className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Target className="w-4 h-4 text-white" />
          </Link>
          <Link href="/" className="text-white font-bold text-xl tracking-tight">
            Job<span className="text-indigo-400">Pilot</span>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="hidden md:flex items-center gap-8 text-sm text-gray-400"
        >
          <a
            href="#features"
            className="hover:text-white transition-colors cursor-pointer"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="hover:text-white transition-colors cursor-pointer"
          >
            How It Works
          </a>
          <a
            href="#pricing"
            className="hover:text-white transition-colors cursor-pointer"
          >
            Pricing
          </a>
          <a
            href="#faq"
            className="hover:text-white transition-colors cursor-pointer"
          >
            FAQ
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center gap-3"
        >
          <Link
            href="/login"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-medium text-white bg-linear-to-r from-indigo-600 to-violet-600 rounded-lg hover:opacity-90 transition-opacity"
          >
            Get Started Free
          </Link>
        </motion.div>
      </nav>

      {/* Hero Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Text */}
          <div>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-medium mb-6"
            >
              <Sparkles className="w-4 h-4" />
              AI Powered Job Application Assistant
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl lg:text-7xl font-bold text-white leading-tight tracking-tight mb-6"
            >
              Land More
              <br />
              <span className="gradient-text">Interviews.</span>
              <br />
              Apply Smarter.
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-gray-400 leading-relaxed mb-8 max-w-lg"
            >
              Generate professional job application emails, optimize resumes,
              track applications, and prepare for interviews using AI.
            </motion.p>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <Link
                href="/register"
                id="hero-cta-start"
                className="group inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-indigo-500/25"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            {/* Early access badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex items-center gap-3 mt-10"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                Now in early access — sign up free
              </div>
            </motion.div>
          </div>

          {/* Right: Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            {/* Glow */}
            <div className="absolute inset-0 bg-linear-to-r from-indigo-600/20 to-violet-600/20 blur-3xl rounded-3xl" />

            <div className="relative glass-card rounded-2xl p-1 border border-white/10">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white/5 rounded-md px-3 py-1 text-xs text-gray-500 text-center">
                    jobpilot.cc/dashboard
                  </div>
                </div>
                <span className="text-[10px] text-gray-600 border border-white/10 px-2 py-0.5 rounded-full">
                  Preview
                </span>
              </div>

              {/* Dashboard content */}
              <div className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Good morning</p>
                    <p className="text-white font-semibold text-sm">
                      Welcome back 👋{" "}
                      <span className="text-gray-500 font-normal text-xs">(sample data)</span>
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 to-violet-600" />
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      label: "Applications",
                      value: "24",
                      color: "text-indigo-400",
                      icon: BarChart3,
                    },
                    {
                      label: "Interviews",
                      value: "6",
                      color: "text-emerald-400",
                      icon: TrendingUp,
                    },
                    {
                      label: "Resume Score",
                      value: "92",
                      color: "text-violet-400",
                      icon: BarChart3,
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-white/5 rounded-xl p-3 border border-white/5"
                    >
                      <stat.icon className={`w-4 h-4 ${stat.color} mb-1`} />
                      <p className={`text-lg font-bold ${stat.color}`}>
                        {stat.value}
                        {stat.label === "Resume Score" ? "%" : ""}
                      </p>
                      <p className="text-gray-500 text-xs">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* AI Email Generator */}
                <div className="bg-linear-to-r from-indigo-500/10 to-violet-500/10 rounded-xl p-3 border border-indigo-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-md bg-indigo-500/20 flex items-center justify-center">
                      <Mail className="w-3 h-3 text-indigo-400" />
                    </div>
                    <p className="text-white text-xs font-medium">
                      AI Email Generator
                    </p>
                    <div className="ml-auto px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs">
                      Ready
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-1.5 bg-white/10 rounded-full">
                      <div className="h-1.5 bg-linear-to-r from-indigo-500 to-violet-500 rounded-full w-[85%]" />
                    </div>
                    <p className="text-gray-500 text-xs">
                      Generating personalized email...
                    </p>
                  </div>
                </div>

                {/* Application Tracker */}
                <div className="bg-slate-900/80 rounded-xl p-3 border border-white/5">
                  <p className="text-white text-xs font-medium mb-2">
                    Recent Applications
                  </p>
                  <div className="space-y-2">
                    {[
                      {
                        company: "Google",
                        role: "SWE II",
                        status: "Interview",
                        color: "text-emerald-400",
                        dot: "bg-emerald-400",
                      },
                      {
                        company: "Stripe",
                        role: "Frontend Eng",
                        status: "Applied",
                        color: "text-amber-400",
                        dot: "bg-amber-400",
                      },
                      {
                        company: "Vercel",
                        role: "Full Stack",
                        status: "Screening",
                        color: "text-indigo-400",
                        dot: "bg-indigo-400",
                      },
                    ].map((app) => (
                      <div
                        key={app.company}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p className="text-white text-xs font-medium">
                            {app.company}
                          </p>
                          <p className="text-gray-500 text-xs">{app.role}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${app.dot}`}
                          />
                          <span className={`text-xs ${app.color}`}>
                            {app.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interview Prep */}
                <div className="bg-white/3 rounded-xl p-3 border border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-violet-500/20 flex items-center justify-center">
                      <Target className="w-3 h-3 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-white text-xs font-medium">
                        Interview Prep
                      </p>
                      <p className="text-gray-500 text-xs">
                        3 questions ready for Google
                      </p>
                    </div>
                    <button className="ml-auto text-xs text-indigo-400 hover:text-indigo-300">
                      Start →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-[#09090b] to-transparent" />
    </section>
  );
}
