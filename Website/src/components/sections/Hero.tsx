"use client";

import React from "react";
import { motion, type Variants } from "motion/react";
import IPhoneFrame from "@/components/ui/iphone-frame";

import {
  Sparkles,
  LayoutGrid,
  Heart,
  Settings,
  CheckCircle2,
  Mail,
} from "lucide-react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      delay: i * 0.1,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

const phoneVariant: Variants = {
  hidden: { opacity: 0, y: 60, rotate: -4, scale: 0.92 },
  show: {
    opacity: 1,
    y: 0,
    rotate: 0,
    scale: 1,
    transition: {
      duration: 1,
      delay: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const avatarGroup = [
  "bg-gradient-to-br from-amber-300 to-orange-500",
  "bg-gradient-to-br from-pink-400 to-rose-500",
  "bg-gradient-to-br from-[#8b5cf6] to-[#a78bfa]",
  "bg-gradient-to-br from-[#3b82f6] to-[#60a5fa]",
];

const Hero = () => {
  return (
    <section className="relative min-h-screen overflow-x-hidden den bg-background pt-4 pb-12 lg:pb-24 flex items-center justify-center">
      {/* ---------- Background Glow Orbs ---------- */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Left Cyan/Mint glow (behind text) */}
        <motion.div
          className="absolute left-[-10%] top-[10%] h-[600px] w-[500px] rounded-full bg-cyan-500/20 blur-[120px]"
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Center Purple glow */}
        <motion.div
          className="absolute left-[30%] top-[30%] h-[500px] w-[500px] rounded-full bg-glow-purple/20 blur-[120px]"
          animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.15, 1] }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />

        {/* Right Pink/Magenta glow (behind phone) */}
        <motion.div
          className="absolute right-[-10%] top-[10%] h-[600px] w-[500px] rounded-full bg-glow-pink/20 blur-[120px]"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />
      </div>

      {/* ---------- Curved Neon SVG Ribbon (Cyan to Purple) ---------- */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          fill="none"
        >
          <defs>
            <linearGradient id="heroRibbon" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="35%" stopColor="#6366f1" />
              <stop offset="70%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>

            <filter id="blurHuge">
              <feGaussianBlur stdDeviation="12" />
            </filter>

            <filter id="blurMedium">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>

          {/* HUGE GLOW */}
          <path
            d="M -10 90
         C 10 95, 20 65, 40 70
         S 70 90, 100 30"
            stroke="url(#heroRibbon)"
            strokeWidth="20"
            opacity="0.12"
            fill="none"
            filter="url(#blurHuge)"
          />

          {/* GLOW 2 */}
          <path
            d="M -10 88
         C 12 92, 25 60, 45 65
         S 75 85, 105 28"
            stroke="url(#heroRibbon)"
            strokeWidth="12"
            opacity="0.18"
            fill="none"
            filter="url(#blurMedium)"
          />

          {/* MAIN RIBBON */}
          <path
            d="M -10 86
         C 15 90, 30 58, 48 63
         S 78 82, 108 26"
            stroke="url(#heroRibbon)"
            strokeWidth="5"
            opacity="0.9"
            strokeLinecap="round"
            fill="none"
          />

          {/* SECONDARY RIBBON */}
          <path
            d="M -10 94
         C 8 98, 22 72, 42 76
         S 70 95, 95 45"
            stroke="url(#heroRibbon)"
            strokeWidth="3"
            opacity="0.6"
            strokeLinecap="round"
            fill="none"
          />

          {/* THIN ACCENT */}
          <path
            d="M 0 100
         C 20 100, 35 80, 55 82
         S 80 95, 110 35"
            stroke="#60a5fa"
            strokeWidth="1.5"
            opacity="0.4"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      {/* ---------- Hero Content ---------- */}
      <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 pt-12 lg:grid-cols-2 lg:gap-20 max-md:pt-28">
        {/* Left Column: Copy */}
        <div className="flex flex-col">
          <motion.h1
            initial="hidden"
            animate="show"
            custom={0}
            variants={fadeUp}
            // text-[clamp(36px,2.5vw,56px)]
            className="text-4xl font-bold leading-[1.15] tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem]"
          >
            Declutter your camera roll in <br className="hidden sm:block" />
            minutes, not hours.
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="show"
            custom={1}
            variants={fadeUp}
            className="mt-5 max-w-md text-base leading-relaxed text-foreground-muted"
          >
            Unpile finds the clutter others miss so you can free up space, stay
            organized, and enjoy your memories again.
          </motion.p>

          <motion.form
            initial="hidden"
            animate="show"
            custom={2}
            variants={fadeUp}
            className="mt-8 flex max-w-md flex-col gap-3 sm:flex-row items-center"
          >
            <div className="relative w-full flex-1 h-14">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
              <input
                type="email"
                required
                placeholder="Enter your email"
                className="w-full rounded-xl h-full bg-background-elevated border border-border-light  px-10 py-3.5 text-sm text-foreground placeholder:text-foreground-subtle outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>
            <button
              type="submit"
              className="whitespace-nowrap max-sm:w-full h-13.5 rounded-[10px] bg-[#2dd4bf] px-6 py-2 text-sm font-semibold text-[#0a0a0f] transition-all hover:bg-[#14b8a6] hover:shadow-lg hover:shadow-[#2dd4bf]/30"
            >
              Get Early Access
            </button>
          </motion.form>

          <motion.div
            initial="hidden"
            animate="show"
            custom={3}
            variants={fadeUp}
            className="mt-6 flex items-center gap-3"
          >
            <div className="flex -space-x-2">
              {avatarGroup.map((cls, i) => (
                <div
                  key={i}
                  className={`h-7 w-7 rounded-full border-2 border-background ${cls}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white font-bold">
              <div className="flex items-center gap-1 text-[#2dd4bf]">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
              Join people on the waitlist
              {/* 47+ */}
            </div>
          </motion.div>
        </div>

        {/* Right Column: Phone Mockup */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={phoneVariant}
          className="relative mx-auto w-full max-w-[320px] lg:max-w-[340px]"
        >
          {/* Soft glow directly behind the phone area */}
          <div className="absolute inset-0 -z-10 rounded-[3rem] bg-glow-purple/40 blur-[100px]" />
          <div className="absolute -bottom-10 left-1/2 -z-10 h-32 w-full -translate-x-1/2 rounded-full bg-cyan-500/30 blur-[60px]" />

          {/* Passing frameStyle="flat" and color="black-titanium" to match the thin, sleek dark frame in the image */}
          <IPhoneFrame
            model="17-pro-max"
            frameStyle="3d"
            color="black-titanium"
          >
            {/* Top Header */}
            <div className="flex items-center justify-between px-5 pt-3 pb-2">
              <span className="text-base font-bold text-white tracking-tight">
                Unpile
              </span>
              <span className="rounded-full bg-[#8b5cf6]/20 px-2.5 py-0.5 text-[10px] font-semibold text-[#a78bfa]">
                PRO
              </span>
            </div>

            {/* Smart Clean Card */}
            <div className="mx-4 rounded-3xl border border-white/5 bg-[#151520] p-6 shadow-2xl">
              <p className="text-center text-sm font-medium text-foreground-muted">
                Smart Clean
              </p>

              {/* Pulsing Glowing Ring with hollow center */}
              <div className="relative mx-auto mt-5 flex h-16 w-16 items-center justify-center">
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-[#3b82f6] via-[#8b5cf6] to-[#a855f7] p-[2px] shadow-[0_0_25px_rgba(139,92,246,0.35)]"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <div className="h-full w-full rounded-full bg-[#151520]" />
                </motion.div>
                {/* Inner core dot */}
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] shadow-inner" />
              </div>

              <div className="mt-4 text-center">
                <span className="text-3xl font-bold text-white tracking-tight">
                  8.64
                </span>
                <span className="ml-1 text-sm font-medium text-foreground-muted">
                  GB
                </span>
              </div>
              <p className="text-center text-xs text-foreground-subtle">
                Ready to free up
              </p>

              <button className="mt-5 w-full rounded-full bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#3b82f6]/30 transition-shadow hover:shadow-[#3b82f6]/50">
                Review Items
              </button>
            </div>

            {/* Quick Stats */}
            <div className="px-4 pt-5 pb-4">
              <p className="mb-3 text-xs font-medium text-foreground-subtle">
                Quick Stats
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: "Photos", value: "12,345" },
                  { label: "Videos", value: "1,234" },
                  { label: "Screenshots", value: "2,123" },
                  { label: "Live Photos", value: "873" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl bg-[#1a1a24] border border-white/5 px-3.5 py-3"
                  >
                    <p className="text-[10px] text-foreground-subtle font-medium">
                      {stat.label}
                    </p>
                    <p className="mt-0.5 text-base font-semibold text-white tracking-tight">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Navigation Tab Bar */}
            <div className="mt-auto flex items-center justify-between border-t border-white/5 bg-black/40 px-6 py-3 backdrop-blur-sm">
              {[
                { icon: Sparkles, label: "Clean", active: true },
                { icon: LayoutGrid, label: "Albums" },
                { icon: Heart, label: "Favorites" },
                { icon: Settings, label: "Settings" },
              ].map(({ icon: Icon, label, active }) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <Icon
                    className={`h-[18px] w-[18px] ${
                      active ? "text-[#3b82f6]" : "text-foreground-subtle"
                    }`}
                    strokeWidth={active ? 2.5 : 2}
                    fill={active ? "#3b82f6" : "none"}
                  />
                  <span
                    className={`text-[9px] font-medium ${
                      active ? "text-[#3b82f6]" : "text-foreground-subtle"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </IPhoneFrame>
          <div
            className="
    absolute
    left-1/2
    top-1/2
    -z-10
    h-[700px]
    w-[700px]
    -translate-x-1/2
    -translate-y-1/2
    rounded-full
    bg-fuchsia-500/20
    blur-[180px]
  "
          />
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
