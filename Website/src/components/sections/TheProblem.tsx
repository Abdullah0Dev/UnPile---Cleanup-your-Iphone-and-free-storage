"use client";

import React from "react";
import { motion, type Variants } from "motion/react";
import { Layers, Crop, PlayCircle } from "lucide-react";

// Shared fade-up pattern (matches Hero.tsx / your global motion convention)
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

type ProblemCard = {
  icon: React.ElementType;
  title: string;
  description: string;
  count: string;
  thumbs: string[]; // gradient classes used as placeholder thumbnails
};

const cards: ProblemCard[] = [
  {
    icon: Layers,
    title: "Too many duplicates",
    description: "Multiple copies take up valuable storage.",
    count: "+293",
    thumbs: [
      "bg-gradient-to-br from-sky-700 to-slate-900",
      "bg-gradient-to-br from-amber-700 to-orange-900",
      "bg-gradient-to-br from-slate-600 to-slate-800",
      "bg-gradient-to-br from-cyan-700 to-blue-950",
      "bg-gradient-to-br from-sky-700 to-slate-900",
      "bg-gradient-to-br from-amber-700 to-orange-900",
      "bg-gradient-to-br from-slate-600 to-slate-800",
      "bg-gradient-to-br from-cyan-700 to-blue-950",
    ],
  },
  {
    icon: Crop,
    title: "Screenshots everywhere",
    description: "Old screenshots you don't need.",
    count: "+157",
    thumbs: [
      "bg-gradient-to-br from-slate-200 to-slate-400",
      "bg-gradient-to-br from-slate-100 to-slate-300",
      "bg-gradient-to-br from-neutral-200 to-neutral-400",
      "bg-gradient-to-br from-slate-300 to-slate-500",
      "bg-gradient-to-br from-slate-100 to-slate-300",
      "bg-gradient-to-br from-neutral-200 to-neutral-400",
      "bg-gradient-to-br from-neutral-200 to-neutral-400",
      "bg-gradient-to-br from-slate-300 to-slate-500",
    ],
  },
  {
    icon: PlayCircle,
    title: "Large videos collect dust",
    description: "Big files you rarely watch.",
    count: "+43",
    thumbs: [
      "bg-gradient-to-br from-emerald-800 to-slate-900",
      "bg-gradient-to-br from-teal-700 to-slate-900",
      "bg-gradient-to-br from-slate-700 to-slate-900",
      "bg-gradient-to-br from-cyan-800 to-slate-900",
      "bg-gradient-to-br from-teal-700 to-slate-900",
      "bg-gradient-to-br from-slate-700 to-slate-900",
      "bg-gradient-to-br from-cyan-800 to-slate-900",
    ],
  },
];

const TheProblem = () => {
  return (
    <section className="relative py-5 sm:py-5">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 lg:grid-cols-[0.55fr_1.15fr] lg:gap-10 lg:px-10">
        {/* Left column: label + heading + copy */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          variants={fadeUp}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-light">
            The Problem
          </p>
          <h2 className="mt-4 text-3xl font-bold leading-tight text-foreground sm:text-4xl">
            Your camera roll shouldn&apos;t be a digital landfill.
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-foreground-muted">
            We take hundreds of photos, screenshots, and videos - most of
            which we&apos;ll never look at again. They eat up space and make
            it harder to find what matters.
          </p>
        </motion.div>

        {/* Right column: 3 cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
                custom={i + 1}
                variants={fadeUp}
                className="flex flex-col rounded-2xl border border-border bg-background-elevated p-5"
              >
                {/* Icon badge */}
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-icon-bg">
                  <Icon className="h-8 w-8 text-primary-light" strokeWidth={1.75} />
                </div>

                {/* Title + description */}
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  {card.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-foreground-subtle">
                  {card.description}
                </p>

                {/* Thumbnail grid */}
                <div className="mt-5 grid grid-cols-4 gap-1.5">
                  {card.thumbs.map((thumb, idx) => (
                    <div
                      key={idx}
                      className={`aspect-square rounded-md ${thumb}`}
                    />
                  ))}
                </div>

                {/* Count badge */}
                <span className="mt-2 self-end text-[11px] font-medium text-foreground-subtle">
                  {card.count}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TheProblem;