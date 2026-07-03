import React from "react";
import { Sparkles } from "lucide-react";
import { navItems } from "@/constants";
import Link from "next/link";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="relative  bg-background">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-6 py-10 sm:flex-row sm:justify-between lg:px-10">
        {/* Logo + tagline */}
        <Link href={"#"} className="flex items-center  gap-0.5">
          {/* <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#3b82f6] shadow-lg shadow-primary/20">
          <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>
        */}
          <Image
            width={30}
            height={30}
            className="object-contain"
            src={"/images/logo.png"}
            alt="unpile logo"
          />
          <span className="text-lg font-extrabold text-foreground tracking-tight">
            Unpile
          </span>
        </Link>

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
