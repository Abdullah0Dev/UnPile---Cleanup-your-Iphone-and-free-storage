"use client";

import React, { ReactNode } from "react";
import { BatteryMedium, Signal, Wifi } from "lucide-react";

// ─── CSS Keyframes (Self-contained) ──────────────────────────────────────────
const FRAME_CSS = `
  @keyframes phoneIn {
    from { transform: translateY(40px) scale(.92); opacity: 0; }
    to   { transform: translateY(0)    scale(1);   opacity: 1; }
  }
`;

// ─── Types ────────────────────────────────────────────────────────────────────
export type PhoneModel = "13-pro-max" | "15-pro-max" | "17-pro-max";
export type PhoneFrameStyle = "flat" | "3d";
export type PhoneColor = 
  | "natural-titanium" 
  | "black-titanium" 
  | "space-gray" 
  | "deep-purple" 
  | "silver"
  | "desert-titanium" // 17 Pro Max New Colors
  | "sapphire-blue"
  | "sage-green";

interface IPhoneFrameProps {
  /** The iPhone model determines the notch/dynamic island */
  model?: PhoneModel;
  /** "flat" = modern matte thin bezel | "3d" = glossy thick bezel with 3D perspective rotation */
  frameStyle?: PhoneFrameStyle;
  /** The color of the device frame */
  color?: PhoneColor;
  /** The content to display on the screen */
  children: ReactNode;
  /** Optional extra class names */
  className?: string;
}

// ─── Frame Configurations ─────────────────────────────────────────────────────
const MODEL_CONFIGS: Record<PhoneModel, { notchType: "notch" | "dynamic-island" }> = {
  "13-pro-max": { notchType: "notch" },
  "15-pro-max": { notchType: "dynamic-island" },
  "17-pro-max": { notchType: "dynamic-island" },
};

const COLOR_CONFIGS: Record<PhoneColor, { bg: string; border: string }> = {
  "natural-titanium": { bg: "#8E8E93", border: "#AEAEB2" },
  "black-titanium": { bg: "#1C1C1E", border: "#2C2C2E" },
  "space-gray": { bg: "#2C2C2E", border: "#3A3A3C" },
  "deep-purple": { bg: "#3B2F4D", border: "#514263" },
  "silver": { bg: "#D1D1D6", border: "#E5E5EA" },
  // NEW 17 PRO COLORS
  "desert-titanium": { bg: "#A86535", border: "#C17A35" },
  "sapphire-blue": { bg: "#2A537A", border: "#4B7EAE" },
  "sage-green": { bg: "#5A6B51", border: "#758A6A" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getGlossyGradient = (bg: string, border: string) => 
  `linear-gradient(145deg, ${border} 0%, ${bg} 40%, ${border} 70%, ${bg} 100%)`;

// ─── Shared Sub-Components ────────────────────────────────────────────────────

const StatusBar = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "4px 23px 2px",
      width: "100%",
      zIndex: 20,
    }}
  >
    <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,.9)", letterSpacing: ".5px" }}>
      9:41
    </span>
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <Signal strokeWidth={4} size={14} color="rgba(255,255,255,.95)" />
      <Wifi strokeWidth={4} size={14} color="rgba(255,255,255,.95)" />
      <BatteryMedium strokeWidth={4} size={14} color="rgba(255,255,255,.95)" />
    </div>
  </div>
);

const NotchRenderer = ({ type }: { type: "notch" | "dynamic-island" }) => {
  if (type === "notch") {
    return (
      <div
        style={{
          position: "absolute",
          top: 12,
          left: "50%",
          transform: "translateX(-50%)",
          width: 150,
          height: 30,
          background: "#000",
          borderRadius: "0 0 18px 18px",
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
        }}
      >
        <div style={{ width: 50, height: 5, background: "#181818", borderRadius: 3, border: "1px solid #252525" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#050505", border: "1.5px solid #1e1e1e" }} />
      </div>
    );
  }

  // Dynamic Island
  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        left: "50%",
        transform: "translateX(-50%)",
        width: 120,
        height: 34,
        background: "#000",
        borderRadius: 20,
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        boxShadow: "0 0 0 1px rgba(255,255,255,.05)",
      }}
    >
      <div style={{ width: 44, height: 5, background: "#181818", borderRadius: 3, border: "1px solid #252525" }} />
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#050505", border: "1.5px solid #1e1e1e" }} />
    </div>
  );
};

// ─── Main Reusable Frame Component ───────────────────────────────────────────
const IPhoneFrame: React.FC<IPhoneFrameProps> = ({
  model = "15-pro-max",
  frameStyle = "flat",
  color = "black-titanium",
  children,
  className = "",
}) => {
  const notchType = MODEL_CONFIGS[model].notchType;
  const colorConfig = COLOR_CONFIGS[color];
  const is3D = frameStyle === "3d";

  // ── Style Definitions ──
  
  // 1. Modern, ultra-premium flat frame with glass edge glow
  const flatStyles = {
    wrapper: {
      transform: "none" as const,
      transformOrigin: "center center" as const,
    },
    frame: {
      background: colorConfig.bg,
      padding: 4, // Minimalist bezel
      borderRadius: 48,
      boxShadow: `
        inset 0 0 0 1px rgba(255,255,255,0.08),
        0 50px 100px -20px rgba(0,0,0,0.90),
        0 30px 60px -30px rgba(0,0,0,0.60),
        0 10px 20px -10px rgba(0,0,0,0.30)
      `,
    },
    screen: {
      background: "#0a0a0a",
      borderRadius: 46,
      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)",
    },
    buttons: {
      background: `linear-gradient(to bottom, ${colorConfig.border}, ${colorConfig.bg})`, 
      shadow: `-2px 0 6px rgba(0,0,0,0.6), inset -1px 0 0 rgba(255,255,255,0.2)`
    }
  };

  // 2. Dramatic 3D glossy frame with hero perspective
  const d3Styles = {
    wrapper: {
      transform: "perspective(1400px) rotateY(-12deg) rotateX(4deg) scale(1.03)",
      transformOrigin: "center center" as const,
      transformStyle: "preserve-3d" as const,
    },
    frame: {
      background: getGlossyGradient(colorConfig.bg, colorConfig.border),
      padding: 9, // Thick, prominent bezel
      borderRadius: 52,
      boxShadow: `
        0 80px 150px -40px rgba(0,0,0,0.95),
        0 40px 80px -20px rgba(0,0,0,0.70),
        0 10px 30px -10px rgba(0,0,0,0.50),
        inset 0 2px 3px rgba(255,255,255,0.45),
        inset 0 -2px 6px rgba(0,0,0,0.8)
      `,
    },
    screen: {
      background: "#0a0a0a",
      borderRadius: 44,
      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.15), inset 0 0 25px rgba(0,0,0,0.7)",
    },
    buttons: {
      background: getGlossyGradient(colorConfig.bg, colorConfig.border),
      shadow: `-2px 0 8px rgba(0,0,0,0.9), inset 0 1px 2px rgba(255,255,255,0.3)`
    }
  };

  const activeStyles = is3D ? d3Styles : flatStyles;

  return (
    <>
      <style>{FRAME_CSS}</style>

      <div 
        className={className} 
        style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          padding: "50px 0 50px 50px" 
        }}
      >
        {/* ── Outer Container with Perspective ── */}
        <div
          style={{
            position: "relative",
            animation: "phoneIn .9s cubic-bezier(.16,1,.3,1) both",
            ...activeStyles.wrapper, 
          }}
        >
          {/* Dual-Layer Studio Ambient Glow */}
          <div
            style={{
              position: "absolute",
              bottom: -10,
              left: is3D ? "40%" : "50%",
              transform: "translateX(-50%)",
              width: is3D ? 320 : 240,
              height: is3D ? 100 : 80,
              background: `radial-gradient(ellipse, rgba(79,70,229,${is3D ? 0.6 : 0.4}) 0%, transparent 70%)`,
              pointerEvents: "none",
              filter: "blur(25px)",
              zIndex: -1,
            }}
          />
          {/* Secondary Cyan Rim Light (Only for 3D to enhance depth) */}
          {is3D && (
            <div
              style={{
                position: "absolute",
                bottom: 20,
                left: "20%",
                transform: "translateX(-50%)",
                width: 140,
                height: 60,
                background: `radial-gradient(ellipse, rgba(34, 211, 238, 0.3) 0%, transparent 70%)`,
                pointerEvents: "none",
                filter: "blur(20px)",
                zIndex: -1,
              }}
            />
          )}

          {/* ── Main Outer Frame ── */}
          <div
            style={{
              position: "relative",
              width: 340,
              height: 695,
              borderRadius: activeStyles.frame.borderRadius,
              padding: activeStyles.frame.padding,
              background: activeStyles.frame.background,
              boxShadow: activeStyles.frame.boxShadow,
            }}
          >
            {/* Side Buttons - Left (Silent / Volume) */}
            <div
              style={{
                position: "absolute",
                left: -4,
                top: 88,
                width: 4,
                height: 28,
                background: activeStyles.buttons.background,
                borderRadius: "3px 0 0 3px",
                boxShadow: activeStyles.buttons.shadow,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: -4,
                top: 128,
                width: 4,
                height: 40,
                background: activeStyles.buttons.background,
                borderRadius: "3px 0 0 3px",
                boxShadow: activeStyles.buttons.shadow,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: -4,
                top: 178,
                width: 4,
                height: 40,
                background: activeStyles.buttons.background,
                borderRadius: "3px 0 0 3px",
                boxShadow: activeStyles.buttons.shadow,
              }}
            />

            {/* Side Buttons - Right (Power) */}
            <div
              style={{
                position: "absolute",
                right: -4,
                top: 146,
                width: 4,
                height: 60,
                background: activeStyles.buttons.background,
                borderRadius: "0 3px 3px 0",
                boxShadow: is3D ? "2px 0 8px rgba(0,0,0,0.9), inset 1px 0 2px rgba(255,255,255,0.3)" : "inset 2px 0 6px rgba(0,0,0,0.5), inset -1px 0 0 rgba(255,255,255,0.1)",
              }}
            />

            {/* ── Screen Bezel ── */}
            <div
              style={{
                width: "100%",
                height: "100%",
                background: activeStyles.screen.background,
                borderRadius: activeStyles.screen.borderRadius,
                overflow: "hidden",
                position: "relative",
                boxShadow: activeStyles.screen.boxShadow,
              }}
            >
              {/* Notch / Dynamic Island */}
              <NotchRenderer type={notchType} />

              {/* Status Bar (Absolute Top) */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, paddingTop: 10 }}>
                <StatusBar />
              </div>

              {/* ── User Content ── */}
              <div
                style={{
                  paddingTop: 42,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    padding: "6px 14px 4px",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  {children}
                </div>

                {/* Home Indicator */}
                <div style={{ display: "flex", justifyContent: "center", paddingBottom: 6 }}>
                  <div style={{ width: 112, height: 5, background: "#2a2a2a", borderRadius: 3 }} />
                </div>
              </div>

              {/* "Glass Edge" Reflection Shine (New Premium Effect) */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "30%",
                  background: `linear-gradient(to bottom, rgba(255,255,255,${is3D ? 0.08 : 0.04}) 0%, transparent 100%)`,
                  pointerEvents: "none",
                  borderRadius: `${activeStyles.screen.borderRadius}px ${activeStyles.screen.borderRadius}px 0 0`,
                  zIndex: 30,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default IPhoneFrame;