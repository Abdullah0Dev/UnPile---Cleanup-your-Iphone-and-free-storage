"use client";

import React from "react";
import { motion, type Variants } from "motion/react";
import { ChevronLeft, MoreVertical, Check } from "lucide-react";
import IPhoneFrame from "../ui/iphone-frame";

// Shared fade-up pattern (matches Hero.tsx / TheProblem.tsx)
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      delay: i * 0.1,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

const steps = [
  {
    number: 1,
    title: "Scan",
    description:
      "Unpile intelligently scans your library to find duplicates, clutter, and large files.",
  },
  {
    number: 2,
    title: "Review",
    description:
      "Preview everything before you delete. You're always in control.",
  },
  {
    number: 3,
    title: "Clean",
    description:
      "Free up space in one tap and enjoy a clutter-free camera roll.",
  },
];

// Placeholder duplicate photo thumbnails for the big phone screen
const duplicateThumbs = [
  "bg-gradient-to-br from-sky-700 to-slate-900",
  "bg-gradient-to-br from-amber-700 to-orange-900",
  "bg-gradient-to-br from-slate-500 to-slate-800",
  "bg-gradient-to-br from-cyan-700 to-blue-950",
  "bg-gradient-to-br from-rose-800 to-slate-900",
  "bg-gradient-to-br from-slate-600 to-slate-900",
  "bg-gradient-to-br from-emerald-800 to-slate-900",
  "bg-gradient-to-br from-indigo-800 to-slate-900",
  "bg-gradient-to-br from-slate-900 to-black",
];

const HowItWorks = () => {
  return (
    <section className="relative overflow-hi dden bg-background py-5 sm:pt-12" id="how-it-works">
      {/* soft ambient glow behind the big phone */}
      <div className="pointer-events-none absolute right-0 top-1/4 h-[420px] w-[420px] rounded-full bg-glow-purple/25 blur-[120px]" />
      <div className="pointer-events-none absolute right-[15%] top-1/3 h-[300px] w-[300px] rounded-full bg-glow-blue/20 blur-[100px]" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-16 px-6 lg:grid-cols-[1fr_2.2fr]  lg:gap-10 lg:px-10">
        {/* ---------- Left column: label, heading, steps, mini phones ---------- */}
        <div>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            variants={fadeUp}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-primary-light">
              How it works
            </p>
            <h2 className="mt-4 max-w-sm text-3xl font-bold leading-tight text-foreground sm:text-4xl">
              3 simple steps to a cleaner camera roll.
            </h2>
          </motion.div>

          <div className="mt-10 grid gap-6 grid-cols-[auto_1fr]">
            {/* Timeline: numbered circles + connecting line */}
            <div className="flex sm:flex-col sm:items-center">
              <div className="flex flex-1 flex-col items-center gap-0 sm:flex-none">
                {steps.map((step, i) => (
                  <React.Fragment key={step.number}>
                    <motion.div
                      initial="hidden"
                      whileInView="show"
                      viewport={{ once: true, amount: 0.6 }}
                      custom={i}
                      variants={fadeUp}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary-light to-primary-dark text-sm font-semibold text-white"
                    >
                      {step.number}
                    </motion.div>
                    {i < steps.length - 1 && (
                      <div className="h-18 w-1.5 bg-linear-to-b from-primary to-accent/60 sm:h-32" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Step text content */}
            <div className="flex flex-col gap-10 md:gap-20">
              {steps.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.5 }}
                  custom={i}
                  variants={fadeUp}
                >
                  <h3 className="text-base font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-1 max-w-xs text-sm leading-relaxed text-foreground-muted">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* ---------- Right column: large phone mockup (Review Items) ---------- */}
        {/* Mini stacked phone mockups (Scan / Review / Clean states) */}
        <div className="grid md:grid-cols-2 grid-col-1 items-center md:-translate-y-12">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            custom={3}
            variants={fadeUp}
            className="mt-10 hidden max-w-sm flex-col gap-4 sm:ml-16 sm:flex lg:ml-20"
          >
            {/* Mini screen 1: Scanning */}
            <div className="rounded-2xl border border-border-light bg-background-elevated p-5 shadow-lg shadow-black/40">
              <div className="mb-2 flex items-center justify-between text-[11px] text-foreground-subtle">
                <span className="font-medium">9:41</span>
                <div className="h-2.5 w-4 rounded-sm border border-foreground-subtle" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                Scanning your library...
              </p>
              <p className="mt-1 text-[11px] text-foreground-subtle">
                12,345 items found
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-background-muted">
                  <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-accent to-primary" />
                </div>
                <span className="text-[11px] font-medium text-foreground-subtle">
                  76%
                </span>
              </div>
              <p className="mt-1.5 text-[10px] text-foreground-subtle">
                Analyzing...
              </p>
            </div>

            {/* Mini screen 2: Review Items */}
            <div className="rounded-2xl border border-border-light bg-background-elevated p-5 shadow-lg shadow-black/40">
              <div className="mb-2 flex items-center justify-between text-[11px] text-foreground-subtle">
                <span className="font-medium">9:41</span>
                <div className="h-2.5 w-4 rounded-sm border border-foreground-subtle" />
              </div>
              <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <ChevronLeft className="h-4 w-4" />
                Review Items
              </div>
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="rounded-md bg-icon-bg px-2.5 py-1 text-[10px] font-semibold text-primary-light">
                  Duplicates 1.2GB
                </span>
                <span className="rounded-md bg-background-muted px-2.5 py-1 text-[10px] font-medium text-foreground-subtle">
                  Screenshots
                </span>
                <span className="rounded-md bg-background-muted px-2.5 py-1 text-[10px] font-medium text-foreground-subtle">
                  Large Videos
                </span>
              </div>
              <div className="flex gap-2">
                {[
                  "bg-gradient-to-br from-sky-600 to-sky-800",
                  "bg-gradient-to-br from-amber-600 to-amber-800",
                  "bg-gradient-to-br from-slate-600 to-slate-800",
                ].map((c, idx) => (
                  <div
                    key={idx}
                    className={`relative h-10 w-10 rounded-lg shadow-inner ${c}`}
                  >
                    <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary ring-2 ring-background">
                      <Check
                        className="h-2.5 w-2.5 text-white"
                        strokeWidth={3}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mini screen 3: Success */}
            <div className="rounded-2xl border border-border-light bg-background-elevated p-6 shadow-lg shadow-black/40">
              <div className="mb-2 flex items-center justify-between text-[11px] text-foreground-subtle">
                <span className="font-medium">9:41</span>
                <div className="h-2.5 w-4 rounded-sm border border-foreground-subtle" />
              </div>
              <div className="flex flex-col items-center py-3 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border-[2.5px] border-success shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                  <Check className="h-5 w-5 text-success" strokeWidth={3} />
                </div>
                <p className="mt-3 text-base font-bold text-foreground">
                  8.64 GB
                </p>
                <p className="text-[11px] font-medium text-foreground-subtle">
                  Successfully freed up
                </p>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={{
              hidden: { opacity: 0, y: 40, scale: 0.96 },
              show: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
              },
            }}
            className="relative mx-auto w-full max-w-[320px] lg:max-w-[360px]"
          >
            <div className="absolute inset-0 -z-10 rounded-[3rem] bg-glow-purple/25 blur-[90px]" />

                  <IPhoneFrame frameStyle="3d" color="deep-purple">
            {/* Full height flex container to push button to bottom */}
            <div className="flex flex-col h-full">
              
              {/* Top Section - Header, Tabs, Actions */}
              <div className="flex-shrink-0">
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-3 pb-2.5">
                  <div className="flex items-center gap-2">
                    <ChevronLeft className="h-4 w-4 text-foreground-muted" />
                    <span className="text-[15px] font-semibold text-foreground">
                      Review Items
                    </span>
                  </div>
                  <MoreVertical className="h-4 w-4 text-foreground-muted" />
                </div>

                {/* Tabs */}
                <div className="mx-4 mb-3 flex gap-1.5">
                  <div className="flex-1 rounded-xl bg-icon-bg px-3 py-2.5 text-center border border-primary/10 shadow-sm">
                    <p className="text-[11px] font-semibold text-primary-light">
                      Duplicates
                    </p>
                    <p className="text-[9px] text-foreground-subtle mt-0.5">1.2 GB</p>
                  </div>
                  <div className="flex-1 rounded-xl px-3 py-2.5 text-center transition-colors hover:bg-icon-bg/30">
                    <p className="text-[11px] font-medium text-foreground-muted">
                      Screenshots
                    </p>
                    <p className="text-[9px] text-foreground-subtle mt-0.5">1.5 GB</p>
                  </div>
                  <div className="flex-1 rounded-xl px-3 py-2.5 text-center transition-colors hover:bg-icon-bg/30">
                    <p className="text-[11px] font-medium text-foreground-muted">
                      Videos
                    </p>
                    <p className="text-[9px] text-foreground-subtle mt-0.5">5.6 GB</p>
                  </div>
                </div>

                {/* Selection Action Bar */}
                <div className="mx-4 mb-2.5 flex items-center justify-between border-b border-white/5 pb-2.5">
                  <span className="text-xs font-medium text-foreground">
                    293 Duplicates
                  </span>
                  <button className="flex items-center gap-1.5 text-[11px] font-semibold text-primary-light hover:text-primary transition-colors">
                    Deselect All
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary shadow-md shadow-primary/30">
                      <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                    </span>
                  </button>
                </div>
              </div>

              {/* Middle Section - Photo Grid (flex-1 pushes footer to the bottom) */}
              <div className="flex-1 overflow-hidden px-4 pb-1">
                <div className="grid grid-cols-3 gap-1.5 h-full content-center">
                  {duplicateThumbs.map((thumb, idx) => (
                    <div
                      key={idx}
                      className={`relative aspect-square rounded-lg shadow-sm ${thumb}`}
                    >
                      <div className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary ring-2 ring-black/40 shadow-sm">
                        <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Section - Footer & Button */}
              <div className="flex-shrink-0 px-4 pt-2 pb-6 bg-gradient-to-t from-background/60 to-transparent">
                <p className="mb-3 text-center text-[11px] font-medium text-foreground-subtle">
                  8.64 GB Selected
                </p>
                <button className="w-full rounded-full bg-gradient-to-r from-primary to-primary-dark py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-primary/30 transition-shadow hover:shadow-primary/50 active:scale-[0.98]">
                  Delete Selected
                </button>
              </div>
              
            </div>
          </IPhoneFrame>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
