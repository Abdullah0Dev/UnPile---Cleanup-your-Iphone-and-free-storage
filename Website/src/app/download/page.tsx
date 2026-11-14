import type { Metadata } from "next";
import { QRCodeSVG } from "qrcode.react";
import { ScanSearch, Eye, Sparkles, WifiOff, UserX, ShieldCheck } from "lucide-react";
import { AppleLogo } from "@/components/ui/apple-logo";
import SmartRedirect from "./smart-redirect";

const APP_STORE_URL =
  "https://apps.apple.com/us/app/unpile-clean-up-photos/id6813002849";

export const metadata: Metadata = {
  title: "Download Unpile – Clean Up Photos for iPhone",
  description:
    "Free up iPhone storage offline. No account, no cloud, 100% on-device.",
  itunes: { appId: "6813002849" }, // Safari smart banner
};

const steps = [
  { Icon: ScanSearch, title: "Scan", text: "Unpile analyzes your camera roll on-device in seconds." },
  { Icon: Eye, title: "Review", text: "Duplicates, screenshots and blurry shots, neatly sorted." },
  { Icon: Sparkles, title: "Clean", text: "Clear gigabytes with a single tap." },
];

const trust = [
  { Icon: WifiOff, label: "Works offline" },
  { Icon: UserX, label: "No account" },
  { Icon: ShieldCheck, label: "Zero data collected" },
];

export default function DownloadPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <SmartRedirect url={APP_STORE_URL} />

      {/* Background glow orbs (matches hero + blog) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[5%] h-[500px] w-[450px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute right-[-10%] top-[15%] h-[500px] w-[450px] rounded-full bg-glow-pink/10 blur-[120px]" />
        <div className="absolute left-[30%] top-[40%] h-[400px] w-[400px] rounded-full bg-glow-purple/10 blur-[120px]" />
      </div>

      {/* ---------- Hero band ---------- */}
      <div className="relative z-10 border-b border-border px-6 pb-20 pt-28">
        <div className="mx-auto flex max-w-[960px] flex-col items-center gap-5 text-center">
      
          <h1 className="text-[clamp(32px,4.5vw,56px)] font-bold leading-[1.1] tracking-tight text-foreground">
            Get Unpile
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              on your iPhone.
            </span>
          </h1>
          <p className="max-w-[480px] text-base leading-relaxed text-foreground-muted">
            Free to start. Scan your camera roll offline and reclaim gigabytes
            in minutes. No uploads, no sign-up.
          </p>

          <a
            href={APP_STORE_URL}
            className="group mt-3 inline-flex items-center justify-center gap-3 rounded-xl bg-cta px-8 py-4 text-base font-bold text-cta-foreground shadow-[0_0_40px_-8px] shadow-cta/60 transition-all hover:bg-cta-hover hover:shadow-cta/80 active:scale-[0.97]"
          >
            <AppleLogo />
            Download on the App Store
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </a>

          <ul className="mt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {trust.map(({ Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Icon className="h-4 w-4 text-cta" />
                {label}
              </li>
            ))}
          </ul>
          <p className="text-xs text-foreground-subtle">Requires iOS 16.4 or later</p>
        </div>
      </div>

      {/* ---------- Steps + QR ---------- */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ Icon, title, text }, i) => (
            <div
              key={title}
              className="flex flex-col gap-4 rounded-3xl border border-white/5 bg-[#151520] p-6 transition-all duration-300 hover:border-primary/40 hover:shadow-[0_8px_32px_rgba(139,92,246,0.15)]"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-icon-bg">
                  <Icon className="h-5 w-5 text-primary-light" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-foreground-subtle">
                  Step {i + 1}
                </span>
              </div>
              <h2 className="text-[17px] font-bold tracking-tight text-white">{title}</h2>
              <p className="text-[13px] leading-relaxed text-foreground-muted">{text}</p>
            </div>
          ))}

          {/* QR card: desktop only (phones get the button / auto-redirect) */}
          <div className="hidden flex-col items-center justify-center gap-4 rounded-3xl border border-white/5 bg-[#151520] p-6 text-center transition-all duration-300 hover:border-primary/40 hover:shadow-[0_8px_32px_rgba(139,92,246,0.15)] lg:flex">
            <div className="rounded-2xl bg-white p-3">
              <QRCodeSVG value={APP_STORE_URL} size={120} />
            </div>
            <p className="text-[13px] leading-relaxed text-foreground-muted">
              Scan with your iPhone camera
            </p>
          </div>
        </div>

        {/* QR below the grid on tablets (md) where the 4th column doesn't exist */}
        <div className="mt-6 hidden items-center justify-center gap-4 rounded-3xl border border-white/5 bg-[#151520] p-6 md:flex lg:hidden">
          <div className="rounded-2xl bg-white p-3">
            <QRCodeSVG value={APP_STORE_URL} size={96} />
          </div>
          <p className="text-[13px] text-foreground-muted">Scan with your iPhone camera</p>
        </div>
      </div>
    </main>
  );
}