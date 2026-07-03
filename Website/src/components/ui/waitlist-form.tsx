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


const WaitlistForm = () => {
     const [email, setEmail] = useState("");
      const [isLoading, setIsLoading] = useState(false);
      const [message, setMessage] = useState<{
        text: string;
        type: "success" | "error";
      } | null>(null);
    
      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);
    
        try {
          const res = await fetch("/api/waitlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
    
          const data = await res.json();
    
          if (res.ok) {
            setMessage({
              text: "You're on the list! Check your inbox for any updates ✨",
              type: "success",
            });
            setEmail(""); // Clear input on success
          } else {
            setMessage({
              text: data.error || "Something went wrong. Please try again.",
              type: "error",
            });
          }
        } catch (error) {
          setMessage({
            text: "Network error. Please check your connection.",
            type: "error",
          });
        } finally {
          setIsLoading(false);
        }
      };
  return (
    <>
     
        <motion.form
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.6 }}
          custom={2}
          variants={fadeUp}
          onSubmit={handleSubmit}
          className="mx-auto mt-8 flex  flex-1 w-full max-w-md flex-col gap-3 sm:flex-row"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full flex-1 rounded-lg border border-border-light bg-background-elevated px-5 py-3 text-sm text-foreground placeholder:text-foreground-subtle outline-none transition-colors focus:border-primary"
          />
          <motion.button
            type="submit"
            disabled={isLoading}
            className="whitespace-nowrap  justify-center disabled:opacity-70 disabled:cursor-not-allowed rounded-lg bg-cta px-6 py-3 text-sm font-semibold text-cta-foreground transition-colors hover:bg-cta-hover flex items-center  gap-2"
          >
            {isLoading ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin text-cta-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Submitting...
              </>
            ) : (
              "Get Early Access"
            )}{" "}
          </motion.button>
        </motion.form>
        {/* Status Feedback Message */}
        {message && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 text-sm font-medium ${
              message.type === "success" ? "text-success" : "text-danger"
            }`}
          >
            {message.text}
          </motion.p>
        )}   
    </>
  )
}

export default WaitlistForm