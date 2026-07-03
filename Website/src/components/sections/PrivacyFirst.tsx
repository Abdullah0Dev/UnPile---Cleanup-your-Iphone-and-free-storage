"use client";

import React from "react";
import { motion, type Variants } from "motion/react";
import { ShieldCheck, UploadCloud, EyeOff, Ban, Lock } from "lucide-react";

// Shared fade-up pattern (matches Hero.tsx / TheProblem.tsx / HowItWorks.tsx / Features.tsx)
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: i * 0.08,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

const privacyPoints = [
  {
    icon: ShieldCheck,
    title: "100% On-Device",
    description: "All processing happens on your iPhone.",
  },
  {
    icon: UploadCloud,
    title: "No Uploads",
    description: "Your photos never leave your device.",
  },
  {
    icon: EyeOff,
    title: "No Tracking",
    description: "We don't track you. Ever.",
  },
  {
    icon: Ban,
    title: "No Ads",
    description: "A clean experience without interruptions.",
  },
];

const PrivacyFirst = () => {
  return (
    <section className="relative overflow-hidden bg-background py-20 sm:py-28" id="privacy">
      {/* ambient background glow */}
      <div className="pointer-events-none absolute right-[8%] top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-glow-blue/15 blur-[130px]" />
      <div className="pointer-events-none absolute right-[20%] top-1/3 h-[280px] w-[280px] rounded-full bg-glow-purple/15 blur-[110px]" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:px-10">
        {/* ---------- Left column: copy + privacy points ---------- */}
        <div>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.5 }}
            variants={fadeUp}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-primary-light">
              Privacy First
            </p>
            <h2 className="mt-4 max-w-md text-3xl font-bold leading-tight text-foreground sm:text-4xl">
              What happens on your iPhone, stays on your iPhone.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-foreground-muted">
              Unpile is built with privacy at its core. We never see your
              photos. We never collect your data. You&apos;re always in
              control.
            </p>
          </motion.div>

          {/* Privacy points row */}
          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
            {privacyPoints.map((point, i) => {
              const Icon = point.icon;
              return (
                <motion.div
                  key={point.title}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.5 }}
                  custom={i + 1}
                  variants={fadeUp}
                  className="group"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border-light bg-white/5 transition-all duration-300 ">
                    <Icon
                      className="h-6 w-6 text-success"
                      strokeWidth={1.75}
                    />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-foreground">
                    {point.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-foreground-subtle">
                    {point.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ---------- Right column: glowing shield illustration ---------- */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={{
            hidden: { opacity: 0, scale: 0.9 },
            show: {
              opacity: 1,
              scale: 1,
              transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
            },
          }}
          className="relative mx-auto flex h-[320px] w-[320px] items-center justify-center sm:h-[380px] sm:w-[380px]"
        >
          {/* pulsing outer glow */}
          <motion.div
            className="absolute inset-0 rounded-full bg-glow-purple/25 blur-[80px]"
            animate={{
              opacity: [0.4, 0.7, 0.4],
              scale: [1, 1.06, 1],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* concentric rings */}
          {[0, 1, 2].map((ring) => (
            <motion.div
              key={ring}
              className="absolute rounded-full border border-primary/20"
              style={{
                width: `${100 - ring * 18}%`,
                height: `${100 - ring * 18}%`,
              }}
              animate={{
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: ring * 0.4,
              }}
            />
          ))}

          {/* Shield with lock, drawn as SVG for crisp neon-outline look */}
              <svg
            viewBox="0 0 200 220"
            className="relative h-full w-full"
            fill="none"
          >
            <defs>
              <linearGradient id="shieldStroke" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent-light)" />
                <stop offset="100%" stopColor="var(--color-primary)" />
              </linearGradient>
              <linearGradient id="lockFill" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--color-primary-light)" />
                <stop offset="100%" stopColor="var(--color-primary-dark)" />
              </linearGradient>
            </defs>

            {/* shield outline only — no interior fill, matches the design's hollow/glass look */}
            <motion.path
              d="M100 12 L172 38 V102 C172 150 144 184 100 206 C56 184 28 150 28 102 V38 Z"
              fill="none"
              stroke="url(#shieldStroke)"
              strokeWidth="2"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              style={{
                filter: "drop-shadow(0 0 12px rgba(96,165,250,0.45))",
              }}
            />

            {/* padlock, solid gradient fill — the one solid element in the illustration */}
            <rect
              x="78"
              y="104"
              width="44"
              height="36"
              rx="7"
              fill="url(#lockFill)"
            />
            <path
              d="M86 104 V90 C86 78 92 71 100 71 C108 71 114 78 114 90 V104"
              stroke="url(#lockFill)"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="100" cy="118" r="3.5" fill="var(--color-background)" />
            <rect
              x="98"
              y="120"
              width="4"
              height="9"
              rx="1.5"
              fill="var(--color-background)"
            />
          </svg>
        </motion.div>
      </div>
    </section>
  );
};

export default PrivacyFirst;