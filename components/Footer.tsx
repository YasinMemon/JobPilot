"use client";

import { motion } from "framer-motion";
import { Target, X, Code2, Globe, Mail } from "lucide-react";
import Link from "next/link";

const navigation = {
  product: [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Dashboard", href: "#dashboard" },
    { name: "Pricing", href: "#pricing" },
    { name: "Changelog", href: "#" },
  ],
  resources: [
    { name: "Documentation", href: "#" },
    { name: "API Reference", href: "#" },
    { name: "Blog", href: "#" },
    { name: "Careers", href: "#" },
    { name: "Status", href: "#" },
  ],
  company: [
    { name: "About", href: "#" },
    { name: "Contact", href: "/contact" },
    { name: "Privacy Policy", href: "/privacy-policy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Cookie Policy", href: "#" },
  ],
};

const socials = [
  { icon: X, href: "#", label: "X (Twitter)" },
  { icon: Code2, href: "#", label: "GitHub" },
  { icon: Globe, href: "#", label: "LinkedIn" },
  { icon: Mail, href: "mailto:support@jobpilot.ai", label: "Email" },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-white/5 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8 relative z-10">
        {/* Top section */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-2 mb-4"
            >
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold text-xl tracking-tight">
                Job<span className="text-indigo-400">Pilot</span>
              </span>
            </motion.div>
            <p className="text-gray-500 text-sm leading-relaxed mb-6 max-w-xs">
              AI-powered job application assistant helping developers, students,
              and job seekers land their dream roles.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-indigo-500/20 hover:border-indigo-500/30 transition-all"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation groups */}
          <div>
            <p className="text-white font-semibold text-sm mb-4">Product</p>
            <ul className="space-y-2.5">
              {navigation.product.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-gray-500 text-sm hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-white font-semibold text-sm mb-4">Resources</p>
            <ul className="space-y-2.5">
              {navigation.resources.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-gray-500 text-sm hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-white font-semibold text-sm mb-4">Company</p>
            <ul className="space-y-2.5">
              {navigation.company.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-gray-500 text-sm hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="glass-card rounded-2xl p-6 border border-white/8 mb-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <p className="text-white font-semibold mb-1">
                Stay in the loop ✉️
              </p>
              <p className="text-gray-500 text-sm">
                Get the latest job search tips and product updates.
              </p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 md:w-64 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
              <button className="px-4 py-2.5 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-sm">
            © {new Date().getFullYear()} JobPilot. All rights reserved. Built
            with ❤️ for job seekers everywhere.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy-policy"
              className="text-gray-600 text-sm hover:text-gray-400 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-gray-600 text-sm hover:text-gray-400 transition-colors"
            >
              Terms of Service
            </Link>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-gray-600 text-xs">All systems normal</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
