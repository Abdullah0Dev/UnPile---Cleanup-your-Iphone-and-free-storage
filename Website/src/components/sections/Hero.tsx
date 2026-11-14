"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import {
  motion,
  animate,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type Variants,
} from "motion/react";
import IPhoneFrame from "@/components/ui/iphone-frame";
import {
  ChevronLeft,
  Smartphone,
  Copy,
  Trash2,
  Droplets,
  Aperture,
  ShieldCheck,
  WifiOff,
  UserX,
} from "lucide-react";
import { AppleLogo } from "../ui/apple-logo";

/* ───────── Brand tokens: paste the real values from constants/theme ───────── */
const BRAND = {
  appBg: "#0A0A14",
  cardBorder: "rgba(255,255,255,0.08)",
  textSecondary: "#9A9AB0",
  primary: "#6C3CE0",
  tileBg: "#1A1830",
};

const CATS = [
  { label: "Screenshots", items: 412, size: "1.1 GB", Icon: Smartphone },
  { label: "Duplicates", items: 236, size: "0.9 GB", Icon: Copy },
  { label: "Clutter", items: 148, size: "0.4 GB", Icon: Trash2 },
  { label: "Blurry Photos", items: 97, size: "0.5 GB", Icon: Droplets },
  { label: "Live Photos", items: 391, size: "0.3 GB", Icon: Aperture },
];
// 1.1+0.9+0.4+0.5+0.3 = 3.2 GB, 412+236+148+97+391 = 1,284 items

const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay: i * 0.1, ease: EASE },
  }),
};

const phoneVariant: Variants = {
  hidden: { opacity: 0, y: 60, rotate: -4, scale: 0.92 },
  show: {
    opacity: 1,
    y: 0,
    rotate: 0,
    scale: 1,
    transition: { duration: 1, delay: 0.4, ease: EASE },
  },
};

/* ───────── Count-up (matches the Remotion `count` effect) ───────── */
function CountUp({
  to,
  decimals = 0,
  delay = 1.1,
  duration = 1.8,
}: {
  to: number;
  decimals?: number;
  delay?: number;
  duration?: number;
}) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(reduce ? to : 0);
  const text = useTransform(mv, (v) =>
    decimals
      ? v.toFixed(decimals)
      : Math.round(v).toLocaleString("en-US"),
  );

  useEffect(() => {
    if (reduce) return;
    const controls = animate(mv, to, { duration, delay, ease: EASE });
    return () => controls.stop();
  }, [to, duration, delay, mv, reduce]);

  return <motion.span>{text}</motion.span>;
} 
const trust = [
  { Icon: WifiOff, label: "Works offline" },
  { Icon: UserX, label: "No account" },
  { Icon: ShieldCheck, label: "Zero data collected" },
];

const Hero = () => {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background pt-4 pb-12 lg:pb-24">
      {/* ---------- Background glows (static blur, opacity-only animation) ---------- */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute left-[-10%] top-[10%] h-[600px] w-[500px] rounded-full bg-cyan-500/20 blur-[120px] will-change-[opacity]"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute left-[30%] top-[30%] h-[500px] w-[500px] rounded-full bg-glow-purple/20 blur-[120px] will-change-[opacity]"
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute right-[-10%] top-[10%] h-[600px] w-[500px] rounded-full bg-glow-pink/20 blur-[120px] will-change-[opacity]"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
      </div>

      {/* ---------- Neon ribbon (unchanged) ---------- */}
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
            <filter id="blurHuge"><feGaussianBlur stdDeviation="12" /></filter>
            <filter id="blurMedium"><feGaussianBlur stdDeviation="6" /></filter>
          </defs>
          <path d="M -10 90 C 10 95, 20 65, 40 70 S 70 90, 100 30" stroke="url(#heroRibbon)" strokeWidth="20" opacity="0.12" filter="url(#blurHuge)" />
          <path d="M -10 88 C 12 92, 25 60, 45 65 S 75 85, 105 28" stroke="url(#heroRibbon)" strokeWidth="12" opacity="0.18" filter="url(#blurMedium)" />
          <path d="M -10 86 C 15 90, 30 58, 48 63 S 78 82, 108 26" stroke="url(#heroRibbon)" strokeWidth="5" opacity="0.9" strokeLinecap="round" />
          <path d="M -10 94 C 8 98, 22 72, 42 76 S 70 95, 95 45" stroke="url(#heroRibbon)" strokeWidth="3" opacity="0.6" strokeLinecap="round" />
          <path d="M 0 100 C 20 100, 35 80, 55 82 S 80 95, 110 35" stroke="#60a5fa" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
        </svg>
      </div>

      {/* ---------- Content ---------- */}
      <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 pt-12 max-md:pt-28 lg:grid-cols-2 lg:gap-20">
        {/* Left: copy */}
        <div className="flex flex-col items-start">
          <motion.span
            initial="hidden" animate="show" custom={0} variants={fadeUp}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-foreground-muted"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#2dd4bf]" />
            Free on the App Store · iPhone
          </motion.span>

          <motion.h1
            initial="hidden" animate="show" custom={1} variants={fadeUp}
            className="text-4xl font-bold leading-[1.15] tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem]"
          >
            Free up gigabytes in minutes. <br className="hidden sm:block" />
            100% offline.
          </motion.h1>

          <motion.p
            initial="hidden" animate="show" custom={2} variants={fadeUp}
            className="mt-5 max-w-md text-base leading-relaxed text-foreground-muted"
          >
            Unpile finds duplicates, blurry shots, screenshots and clutter in
            seconds, all on your phone. Your photos never leave your device.
          </motion.p>

          <motion.div
            initial="hidden" animate="show" custom={3} variants={fadeUp}
            className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center"
          >
            <Link
              href="/download"
              className="group mt-3 inline-flex items-center justify-center gap-3 rounded-xl bg-cta px-8 py-4 text-base font-bold text-cta-foreground shadow-[0_0_40px_-8px] shadow-cta/40 transition-all  active:scale-[0.97] hover:shadow-cta/50"
            >
              <AppleLogo />
              Download for iPhone
            </Link>
            <span className="text-center text-xs text-shadow-foreground-subtle font-  sm:text-left">
              Free to start · No sign-up
            </span>
          </motion.div>

          <motion.ul
            initial="hidden" animate="show" custom={4} variants={fadeUp}
            className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2"
          >
            {trust.map(({ Icon, label }) => (
              <li key={label} className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <Icon className="h-3.5 w-3.5 text-[#2dd4bf]" />
                {label}
              </li>
            ))}
          </motion.ul>
        </div>

        {/* Right: phone (mirrors RN Home / Scan Complete) */}
        <motion.div
          initial="hidden" animate="show" variants={phoneVariant}
          className="relative mx-auto w-full max-w-[320px] lg:max-w-[340px]"
        >
          <div className="absolute inset-0 -z-10 rounded-[3rem] bg-glow-purple/40 blur-[100px]" />
          <div className="absolute -bottom-10 left-1/2 -z-10 h-32 w-full -translate-x-1/2 rounded-full bg-cyan-500/30 blur-[60px]" />

          <IPhoneFrame model="17-pro-max" frameStyle="3d" color="black-titanium">
            <div
              className="flex h-full flex-col px-3.5 pb-6 "
              style={{ background: BRAND.appBg }}
            >
              {/* Back */}
              <div className="mb-3 flex h-9 items-center">
                <ChevronLeft className="h-6 w-6 text-white/90" />
              </div>

              <p className="mb-4 text-center text-[17px] font-semibold text-white">
                Scan Complete ✨
              </p>

              {/* Stat card */}
              <div
                className="relative mb-4 flex flex-col items-center overflow-hidden rounded-[24px] border py-5"
                style={{ borderColor: BRAND.cardBorder }}
              >
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(115deg, rgba(108,60,224,0) 0%, rgba(108,60,224,0.08) 30%, rgba(108,60,224,0.25) 50%, rgba(108,60,224,0.08) 70%, rgba(108,60,224,0) 100%)",
                  }}
                />
                <span className="z-10 text-[11px]" style={{ color: BRAND.textSecondary }}>
                  You can free up
                </span>
                <span
                  className="z-10 my-0.5 text-[34px] font-bold tracking-tight text-white"
                  style={{ textShadow: "0 0 24px rgba(139,92,246,0.55)" }}
                >
                  <CountUp to={3.2} decimals={1} /> GB
                </span>
                <span className="z-10 text-[11px]" style={{ color: BRAND.textSecondary }}>
                  <CountUp to={1284} /> items
                </span>
              </div>

              {/* Section header */}
              <div className="mb-2.5 flex items-center justify-between px-1">
                <span className="text-[17px] font-semibold text-white">Categories</span>
                <span className="text-[13px] font-medium" style={{ color: BRAND.primary }}>
                  See All
                </span>
              </div>

              {/* Rows */}
              <div className="flex flex-1 flex-col gap-1.5 overflow-hidden">
                {CATS.map(({ label, items, size, Icon }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.9 + i * 0.07, ease: EASE }}
                    className="flex items-center rounded-2xl border px-3 py-2.5"
                    style={{ background: "#12112860", borderColor: BRAND.cardBorder }}
                  >
                    <div
                      className="mr-3 flex h-8 w-8 items-center justify-center rounded-xl"
                      style={{ background: BRAND.tileBg }}
                    >
                      <Icon className="h-4 w-4 text-[#a78bfa]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[12px] font-medium text-white">{label}</p>
                      <p className="text-[10px]" style={{ color: BRAND.textSecondary }}>
                        {items.toLocaleString("en-US")} items
                      </p>
                    </div>
                    <span className="text-[12px] font-medium text-white">{size}</span>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <button className="mt-3 w-full rounded-full bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] py-3 text-[13px] font-semibold text-white shadow-lg shadow-[#6C3CE0]/30">
                Review Items
              </button>
            </div>
          </IPhoneFrame>

          <div className="absolute left-1/2 top-1/2 -z-10 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-500/20 blur-[180px]" />
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;