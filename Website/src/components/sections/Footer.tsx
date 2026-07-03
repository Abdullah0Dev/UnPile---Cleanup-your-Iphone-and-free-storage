import React from "react";
import { Sparkles } from "lucide-react";
import { navItems } from "@/constants";


const Footer = () => {
  return (
    <footer className="relative  bg-background">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-6 py-10 sm:flex-row sm:justify-between lg:px-10">
        {/* Logo + tagline */}
        <div className="flex flex-col items-center gap-1.5 sm:items-start">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark">
              <Sparkles className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-base font-semibold text-foreground">
              Unpile
            </span>
          </div>
          <p className="text-xs text-foreground-subtle">
            Declutter smarter. Live lighter.
          </p>
        </div>

        {/* Nav links */}
        <nav className="flex flex-wrap items-center justify-center gap-6">
          {navItems.map((link) => (
            <a
              key={link.item}
              href={link.href}
              className="text-sm text-foreground-muted transition-colors hover:text-foreground"
            >
              {link.item}
            </a>
          ))}
        </nav>

        {/* Copyright */}
        <p className="text-xs text-foreground-subtle">
          © 2026 Unpile. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;