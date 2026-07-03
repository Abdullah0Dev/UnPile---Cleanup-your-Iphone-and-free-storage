"use client";

import React from "react";
import { motion, type Variants } from "motion/react";
import WaitlistForm from "../ui/waitlist-form";

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
  return (
    <section
      id="join-waitlist"
      className="relative max-w-7xl w-full  place-self-center overflow-hidden  backdrop-blur-3xl py-8 sm:mx-12 mx-4  rounded-2xl"
    >
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
          Early access is coming soon. Join the waitlist and we&apos;ll let you
          know.
        </motion.p>
        <WaitlistForm />
      </div>
    </section>
  );
};

export default CTAButton;
