"use client";

import React, { useState } from "react";
import { motion, type Variants } from "motion/react";

// Shared fade-up pattern (matches Hero.tsx / other sections)
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

const CTAButton = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // hook up to your waitlist endpoint / Resend flow here
  };

  return (
    <section className="relative max-w-7xl w-full  place-self-center overflow-hidden  backdrop-blur-3xl py-8 sm:mx-12 mx-4  rounded-2xl">
      {/* faint ambient glow, kept subtle since this band is mostly plain in the design */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[280px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-glow-purple/10 blur-[130px]" />

      <div className="relative mx-auto max-w-2xl px-6 text-center lg:px-10">
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.6 }}
          custom={0}
          variants={fadeUp}
          className="text-3xl font-bold leading-tight text-foreground sm:text-4xl"
        >
          Be the first to declutter better.
        </motion.h2>

        <motion.p
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.6 }}
          custom={1}
          variants={fadeUp}
          className="mt-4 text-sm text-foreground-muted sm:text-base"
        >
          Early access is coming soon. Join the waitlist and we&apos;ll let
          you know.
        </motion.p>

        <motion.form
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.6 }}
          custom={2}
          variants={fadeUp}
          onSubmit={handleSubmit}
          className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full flex-1 rounded-lg border border-border-light bg-background-elevated px-5 py-3 text-sm text-foreground placeholder:text-foreground-subtle outline-none transition-colors focus:border-primary"
          />
          <button
            type="submit"
            className="whitespace-nowrap rounded-lg bg-cta px-6 py-3 text-sm font-semibold text-cta-foreground transition-colors hover:bg-cta-hover"
          >
            Get Early Access
          </button>
        </motion.form>
      </div>
    </section>
  );
};

export default CTAButton;