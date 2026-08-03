"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    id: "testimonial-sarah",
    name: "Sarah Chen",
    role: "Software Engineer",
    company: "Now at Google",
    avatar: "SC",
    gradient: "from-indigo-500 to-violet-600",
    rating: 5,
    quote:
      "JobPilot completely transformed my job search. The AI-generated emails got me 3x more responses, and the interview prep feature helped me land my dream role at Google. I can't imagine going back to the old way.",
    highlight: "3x more responses",
  },
  {
    id: "testimonial-marcus",
    name: "Marcus Rodriguez",
    role: "Product Manager",
    company: "Now at Stripe",
    avatar: "MR",
    gradient: "from-violet-500 to-fuchsia-600",
    rating: 5,
    quote:
      "As a career changer, I was overwhelmed. JobPilot's resume analyzer showed me exactly what to fix for each role, and the AI suggestions were spot-on. Went from 0 responses to 8 interviews in 2 weeks.",
    highlight: "8 interviews in 2 weeks",
  },
  {
    id: "testimonial-priya",
    name: "Priya Sharma",
    role: "Data Scientist",
    company: "Now at OpenAI",
    avatar: "PS",
    gradient: "from-emerald-500 to-teal-600",
    rating: 5,
    quote:
      "The resume score feature alone is worth it — I went from 45% ATS match to 91% after following the AI recommendations. JobPilot is the unfair advantage every job seeker needs.",
    highlight: "91% ATS match score",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-150 h-px bg-linear-to-r from-transparent via-white/5 to-transparent" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-linear-to-br from-indigo-600/8 to-indigo-600/4 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-48 h-48 bg-linear-to-br from-violet-600/8 to-violet-600/4 rounded-full blur-3xl" />
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm font-medium mb-4">
            ✦ Success Stories
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Loved by <span className="gradient-text">Job Seekers</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Join thousands of professionals who landed their dream jobs using
            JobPilot.
          </p>

          {/* Rating summary */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className="w-5 h-5 text-amber-400 fill-amber-400"
                />
              ))}
            </div>
            <span className="text-white font-bold text-lg">4.9</span>
            <span className="text-gray-400">from 2,400+ reviews</span>
          </div>
        </motion.div>

        {/* Testimonial Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              id={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="relative glass-card rounded-2xl p-6 border border-white/8 overflow-hidden group"
            >
              {/* Top border glow */}
              <div
                className={`absolute top-0 left-0 right-0 h-px bg-linear-to-r ${testimonial.gradient} opacity-50`}
              />

              {/* Background glow on hover */}
              <div
                className={`absolute inset-0 bg-linear-to-br ${testimonial.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 rounded-2xl`}
              />

              <div className="relative z-10">
                {/* Quote icon */}
                <div
                  className={`w-10 h-10 rounded-xl bg-linear-to-br ${testimonial.gradient} flex items-center justify-center mb-4 opacity-70`}
                >
                  <Quote className="w-5 h-5 text-white" />
                </div>

                {/* Highlight badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-white/10 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-emerald-400 text-xs font-medium">
                    {testimonial.highlight}
                  </span>
                </div>

                {/* Quote */}
                <p className="text-gray-300 text-sm leading-relaxed mb-6">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>

                {/* Stars */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-3.5 h-3.5 text-amber-400 fill-amber-400"
                    />
                  ))}
                </div>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full bg-linear-to-br ${testimonial.gradient} flex items-center justify-center text-white text-sm font-bold`}
                  >
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">
                      {testimonial.name}
                    </p>
                    <p className="text-gray-500 text-xs">{testimonial.role}</p>
                    <p className="text-indigo-400 text-xs">
                      {testimonial.company}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
