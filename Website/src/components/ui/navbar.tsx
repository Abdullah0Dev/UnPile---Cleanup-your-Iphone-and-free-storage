import { Sparkles } from "lucide-react";
import React from "react";

const Navbar = () => {
  return (
    <nav className=" z-20 max-sm:mx-auto mx-5 max-w-6xl flex items-center place-self-center justify-between rounded-2xl bg-black/40 fixed w-full  top-5 px-6 py-4 backdrop-blur-3xl border border-white/5 shadow-2xl">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#3b82f6] shadow-lg shadow-primary/20">
          <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-lg font-bold text-foreground tracking-tight">
          Unpile
        </span>
      </div>

      <div className="hidden items-center gap-8 md:flex">
        {["How it works", "Features", "Privacy", "FAQ"].map((item) => (
          <a
            key={item}
            href="#"
            className="text-sm text-foreground-muted transition-colors hover:text-foreground font-medium"
          >
            {item}
          </a>
        ))}
      </div>

      <button className="rounded-[10px] bg-[#2dd4bf] px-5 py-2.5 text-sm font-semibold text-[#0a0a0f] transition-all hover:bg-[#14b8a6] hover:shadow-lg hover:shadow-[#2dd4bf]/30">
        Get Early Access
      </button>
    </nav>
  );
};

export default Navbar;
