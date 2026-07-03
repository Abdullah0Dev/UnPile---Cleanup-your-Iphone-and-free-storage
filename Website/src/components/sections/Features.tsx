"use client";

import React from "react";
import { motion, type Variants } from "motion/react";
import { Smartphone, Layers, Grid2x2, Target } from "lucide-react";

// Shared fade-up pattern (matches Hero.tsx / TheProblem.tsx / HowItWorks.tsx)
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

type Feature = {
  icon: React.ElementType;
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    icon: Smartphone,
    title: "Screenshot Sweeper",
    description: "Find and remove old screenshots in seconds.",
  },
  {
    icon: Layers,
    title: "Similar Photo Finder",
    description: "Detect similar photos others miss.",
  },
  {
    icon: Grid2x2,
    title: "Blur Guard",
    description: "Keep blurry photos out of your memories.",
  },
  {
    icon: Target,
    title: "Live Photo Slimmer",
    description: "Shrink Live Photos without losing moments.",
  },
];

const Features = () => {
  return (
    <section className="relative max-w-7xl place-self-center overflow-hidden bg-background-elevated/40 backdrop-blur-3xl py-8 sm:mx-12 mx-4  rounded-2xl">
      {/* subtle ambient glow to lift the panel off the page */}
      <div className="pointer-events-none absolute left-1/4 top-0 h-[300px] w-[500px] -translate-y-1/2 rounded-full bg-glow-purple/10 blur-[130px]" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-[280px] w-[400px] translate-y-1/3 rounded-full bg-glow-blue/10 blur-[120px]" />

      {/* faint top/bottom hairlines to read as a distinct "band" */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border-light to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border-light to-transparent" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 lg:grid-cols-[0.7fr_1.4fr] lg:items-center lg:gap-8 lg:px-10">
        {/* Left column: label + heading */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.5 }}
          variants={fadeUp}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-light">
            Powerful Features
          </p>
          <h2 className="mt-4 max-w-xs text-3xl font-bold leading-tight text-foreground sm:text-4xl">
            Everything you need. Nothing you don&apos;t.
          </h2>
        </motion.div>

        {/* Right column: 4 feature cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.4 }}
                custom={i + 1}
                variants={fadeUp}
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="group relative overflow-hidden rounded-2xl border border-border bg-[#FFFFFF60]/5 p-5"
              >
                {/* hover glow */}
                <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/0 blur-2xl transition-colors duration-500 group-hover:bg-primary/25" />

                {/* Icon badge with animated ring */}
                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-icon-bg ring-1 ring-inset ring-border-light transition-all duration-300 group-hover:ring-primary/50">
                  <Icon
                    className="h-8 w-8 text-primary-light transition-transform duration-300 group-hover:scale-110"
                    strokeWidth={1.75}
                  />
                </div>

                <h3 className="relative mt-4 text-sm font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="relative mt-1.5 text-xs leading-relaxed text-foreground-subtle">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
