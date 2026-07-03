"use client";

import Link from "next/link";
import { motion, type Variants } from "motion/react";
import {
  Sparkles,
  Home,
  ArrowRight,
  FileQuestion,
  Sparkle,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";
import Navbar from "@/components/ui/navbar";

// Shared fade-up pattern (matches Hero.tsx / TheProblem.tsx / HowItWorks.tsx / Features.tsx)
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      delay: i * 0.08,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

const quickLinks = [
  {
    icon: Sparkle,
    label: "How it works",
    description: "See the 3 steps to a cleaner camera roll",
    href: "/#how-it-works",
  },
  {
    icon: Home,
    label: "Features",
    description: "Everything Unpile can clean up for you",
    href: "/#features",
  },
  {
    icon: ShieldCheck,
    label: "Privacy",
    description: "What happens on your iPhone, stays there",
    href: "/#privacy",
  },
  {
    icon: HelpCircle,
    label: "FAQ",
    description: "Answers to common questions",
    href: "/#faq",
  },
];

const NotFoundPage = () => {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* ---------- Background glow / gradient effects ---------- */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute left-[10%] top-[20%] h-[420px] w-[420px] rounded-full bg-glow-purple/30 blur-[110px]"
          animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.08, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[10%] top-[10%] h-[380px] w-[380px] rounded-full bg-glow-blue/25 blur-[100px]"
          animate={{ opacity: [0.25, 0.45, 0.25], scale: [1, 1.1, 1] }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        <motion.div
          className="absolute bottom-[10%] left-[35%] h-[320px] w-[320px] rounded-full bg-glow-pink/15 blur-[100px]"
          animate={{ opacity: [0.15, 0.3, 0.15] }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />
      </div>

      {/* ---------- Nav (same as Hero) ---------- */}

      <Navbar />

      {/* ---------- Main content ---------- */}
      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 pb-8 pt-28 text-center sm:pt-32">
        {/* Icon badge */}
        <motion.div
          initial="hidden"
          animate="show"
          custom={0}
          variants={fadeUp}
          className="flex h-16 w-16 items-center justify-center rounded-full border border-border-light bg-icon-bg"
        >
          <FileQuestion className="h-7 w-7 text-primary-light" strokeWidth={1.5} />
        </motion.div>

        {/* Eyebrow */}
        <motion.p
          initial="hidden"
          animate="show"
          custom={1}
          variants={fadeUp}
          className="mt-6 text-xs font-semibold uppercase tracking-widest text-primary-light"
        >
          Page Not Found
        </motion.p>

        {/* Big 404 headline */}
        <motion.h1
          initial="hidden"
          animate="show"
          custom={2}
          variants={fadeUp}
          className="mt-4 text-[clamp(64px,12vw,140px)] font-black leading-none tracking-tight text-foreground"
        >
          4
          <span className="bg-gradient-to-br from-accent-light to-primary bg-clip-text text-transparent">
            0
          </span>
          4
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial="hidden"
          animate="show"
          custom={3}
          variants={fadeUp}
          className="mt-5 max-w-md text-sm leading-relaxed text-foreground-muted sm:text-base"
        >
          Looks like this page got swept up with the clutter. It doesn&apos;t
          exist, or it may have been moved.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial="hidden"
          animate="show"
          custom={4}
          variants={fadeUp}
          className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
        >
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-lg bg-cta px-6 py-3 text-sm font-semibold text-cta-foreground transition-colors hover:bg-cta-hover no-underline"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
          <Link
            href="/#how-it-works"
            className="flex items-center justify-center gap-2 rounded-lg border border-border-light bg-background-elevated px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/50 no-underline"
          >
            See how it works
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </motion.div>
      </div>

      {/* ---------- Quick links grid ---------- */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 pb-24">
        <motion.p
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.6 }}
          custom={0}
          variants={fadeUp}
          className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-foreground-subtle"
        >
          Or try one of these
        </motion.p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {quickLinks.map(({ icon: Icon, label, description, href }, i) => (
            <motion.div
              key={label}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.4 }}
              custom={i + 1}
              variants={fadeUp}
            >
              <Link
                href={href}
                className="group flex items-center gap-4 rounded-2xl border border-border bg-background-elevated px-5 py-4 no-underline transition-all duration-300 hover:border-primary/50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-icon-bg transition-colors duration-300 group-hover:bg-primary">
                  <Icon
                    className="h-4 w-4 text-primary-light transition-colors duration-300 group-hover:text-white"
                    strokeWidth={1.75}
                  />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-sm font-semibold leading-none text-foreground">
                    {label}
                  </p>
                  <p className="mt-1.5 text-xs leading-snug text-foreground-subtle">
                    {description}
                  </p>
                </div>
                <ArrowRight
                  className="h-4 w-4 shrink-0 text-foreground-subtle transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-primary-light"
                  strokeWidth={2}
                />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ---------- Bottom strip ---------- */}
      <div className="relative z-10 border-t border-border px-6 py-8 text-center">
        <p className="text-sm text-foreground-subtle">
          Still stuck?{" "}
          <a
            href="mailto:contact@unpile.com"
            className="font-semibold text-primary-light underline underline-offset-2 transition-colors hover:text-primary"
          >
            Talk to us
          </a>{" "}
          and we&apos;ll point you in the right direction.
        </p>
      </div>
    </main>
  );
};

export default NotFoundPage;