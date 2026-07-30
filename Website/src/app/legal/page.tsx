"use client";

import React, { useState } from "react";
import { motion, type Variants, AnimatePresence } from "motion/react";
import {
  Shield,
  Lock,
  ServerOff,
  Database,
  CheckCircle2,
  Mail,
  MessageCircle,
  AlertCircle,
  FileText,
} from "lucide-react";
import Navbar from "@/components/ui/navbar";

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

const LegalPage = () => {
  // State to toggle between tabs
  const [activeTab, setActiveTab] = useState<"privacy" | "terms">("privacy");

  return (
    <section className="relative min-h-screen overflow-hidden bg-background py-32 lg:py-40">
      <Navbar />
      {/* ---------- Background Glow Orbs ---------- */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute left-[-10%] top-[10%] h-[600px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px]"
          animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[-10%] bottom-[10%] h-[600px] w-[500px] rounded-full bg-glow-pink/10 blur-[120px]"
          animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.15, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-6">
        
        {/* ----- Header & Tab Switcher ----- */}
        <motion.div
          initial="hidden"
          animate="show"
          custom={0}
          variants={fadeUp}
          className="flex flex-col items-center text-center"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#151520] border border-white/5 shadow-xl mb-6">
            <Shield className="h-8 w-8 text-[#3b82f6]" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Legal & Policies
          </h1>
          <p className="mt-4 text-lg text-foreground-muted leading-relaxed max-w-2xl">
            Your trust is our priority. Read our policies below.
          </p>

          {/* Tab Switcher */}
          <div className="mt-8 flex items-center rounded-full border border-white/10 bg-[#151520]/60 p-1 backdrop-blur-sm">
            <button
              onClick={() => setActiveTab("privacy")}
              className={`rounded-full px-6 py-2.5 text-sm font-medium transition-all duration-300 ${
                activeTab === "privacy"
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-foreground-muted hover:text-white"
              }`}
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setActiveTab("terms")}
              className={`rounded-full px-6 py-2.5 text-sm font-medium transition-all duration-300 ${
                activeTab === "terms"
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-foreground-muted hover:text-white"
              }`}
            >
              Terms of Service
            </button>
          </div>
        </motion.div>

        {/* ----- Animated Content Area ----- */}
        <div className="mt-12">
          <AnimatePresence mode="wait">
            {activeTab === "privacy" && (
              <motion.div
                key="privacy"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="space-y-6"
              >
                {/* Zero Data Card */}
                <div className="rounded-3xl border border-white/5 bg-[#151520] p-8 shadow-2xl backdrop-blur-sm">
                  <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
                    <ServerOff className="h-5 w-5 text-red-400" />
                    Our Zero Data Promise
                  </h2>
                  <p className="mt-3 leading-relaxed text-foreground-muted">
                    Unpile is built for privacy. We do not send your photos, videos, metadata, or
                    any personal information to our servers. All processing—including AI categorization
                    and duplicate detection—happens <strong className="text-white">entirely on your device</strong>.
                  </p>
                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {[
                      "We don't collect your email address",
                      "We don't use analytics trackers",
                      "We don't receive crash reports",
                      "We don't see your photo albums",
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm text-foreground-muted">
                        <CheckCircle2 className="h-4 w-4 text-[#2dd4bf]" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Storage & Transfer Grid */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="rounded-3xl border border-white/5 bg-[#151520]/80 p-6 shadow-lg">
                    <Lock className="h-6 w-6 text-[#8b5cf6] mb-4" />
                    <h3 className="text-lg font-semibold text-white">Data Storage</h3>
                    <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                      We do not store your data. Once you close the app, the memory is cleared.
                      The only data retained is your preference settings within your local device&apos;s app storage.
                    </p>
                  </div>
                  <div className="rounded-3xl border border-white/5 bg-[#151520]/80 p-6 shadow-lg">
                    <Database className="h-6 w-6 text-cyan-400 mb-4" />
                    <h3 className="text-lg font-semibold text-white">Data Transfer</h3>
                    <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                      Data never leaves your device. There are no data pipelines, no syncing,
                      and no cloud backups. What happens on your iPhone, stays on your iPhone.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "terms" && (
              <motion.div
                key="terms"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="space-y-6"
              >
                {/* Disclaimer Card */}
                <div className="rounded-3xl border border-white/5 bg-[#151520] p-8 shadow-2xl">
                  <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                    Important Disclaimer
                  </h2>
                  <p className="mt-3 leading-relaxed text-foreground-muted">
                    Unpile is a tool designed to help you efficiently manage your storage.
                    <span className="block mt-2 text-white font-medium">
                      You are solely responsible for backing up your photos and important media
                      before performing cleaning actions.
                    </span>
                    We recommend using iCloud, Google Photos, or other external backups.
                    Unpile is not liable for any accidental deletions or data loss.
                  </p>
                </div>

                {/* Terms Grid */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="rounded-3xl border border-white/5 bg-[#151520]/80 p-6 shadow-lg">
                    <FileText className="h-6 w-6 text-cyan-400 mb-4" />
                    <h3 className="text-lg font-semibold text-white">Acceptance of Terms</h3>
                    <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                      By downloading and using Unpile, you confirm that you accept these terms
                      and agree to comply with them. If you do not agree, you must not use the app.
                    </p>
                  </div>
                  <div className="rounded-3xl border border-white/5 bg-[#151520]/80 p-6 shadow-lg">
                    <Shield className="h-6 w-6 text-[#8b5cf6] mb-4" />
                    <h3 className="text-lg font-semibold text-white">Privacy Commitment</h3>
                    <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                      We respect your privacy. As outlined in our Privacy Policy, Unpile does
                      not collect or transmit any user data. All processing occurs on your
                      local device.
                    </p>
                  </div>
                </div>

                {/* Third Party / IP */}
                <div className="rounded-3xl border border-white/5 bg-[#151520]/60 p-6 backdrop-blur-sm">
                  <h3 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider">
                    Intellectual Property & Third-Party Acknowledgments
                  </h3>
                  <div className="mt-4 space-y-3 text-sm text-foreground-muted leading-relaxed">
                    <p>
                      <strong className="text-white">1. Unpile Content:</strong> The app&apos;s
                      UI, design, logos, and code are the exclusive property of Unpile.
                      You may not reproduce, modify, or redistribute any part of the app
                      without our explicit permission.
                    </p>
                    <p>
                      <strong className="text-white">2. App Store & Apple: </strong> Unpile
                      is distributed via the Apple App Store. By using the app, you are
                      also agreeing to Apple&apos;s standard End User License Agreement (EULA)
                      set forth by the App Store.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ----- Contact & Support Section (Shared for both) ----- */}
        <motion.div
          initial="hidden"
          animate="show"
          custom={3}
          variants={fadeUp}
          className="mt-12 rounded-3xl border border-white/5 bg-[#151520]/60 p-6 backdrop-blur-sm"
        >
          <h3 className="text-center text-sm font-semibold text-foreground-muted uppercase tracking-wider">
            Have questions or feedback?
          </h3>
          <div className="mt-4 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="https://wa.me/message/K7CQ2SWKHG7OG1"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10 sm:w-auto"
            >
              <MessageCircle className="h-4 w-4 text-[#25D366]" />
              Text us on WhatsApp
            </a>
            <a
              href="mailto:contact@unpile.com"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10 sm:w-auto"
            >
              <Mail className="h-4 w-4 text-cyan-400" />
              contact@unpile.com
            </a>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default LegalPage;