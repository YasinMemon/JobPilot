"use client";

import { motion } from "framer-motion";
import { Target, Mail } from "lucide-react";
import Link from "next/link";
import { SUPPORT_EMAIL } from "@/lib/site-config";

/**
 * Footer navigation.
 * Only include links that point to real pages.
 * Links with href "#" have been removed until the pages exist.
 */
const navigation = {
  product: [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Dashboard", href: "#dashboard" },
  ],
  // Resources section intentionally omitted — docs/blog/API/careers/status
  // pages do not yet exist. Re-add when pages are live.
  company: [
    { name: "Contact", href: "/contact" },
    { name: "Privacy Policy", href: "/privacy-policy" },
    { name: "Terms of Service", href: "/terms" },
  ],
};

export default function Footer() {
  return (
    <footer className="relative border-t border-white/5 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8 relative z-10">
        {/* Top section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
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
            {/* Contact link in place of social icons until real profiles exist */}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="inline-flex items-center gap-2 text-gray-500 text-sm hover:text-indigo-400 transition-colors"
              aria-label="Email support"
            >
              <Mail className="w-4 h-4" />
              {SUPPORT_EMAIL}
            </a>
          </div>

          {/* Product navigation */}
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

          {/* Company navigation */}
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

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-sm">
            © {new Date().getFullYear()} JobPilot. All rights reserved.
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
          </div>
        </div>
      </div>
    </footer>
  );
}
