import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import { Calendar, Clock, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Blog – iPhone Storage & Photo Cleanup Tips | Unpile",
  description:
    "Guides on freeing up iPhone storage, finding duplicate photos, clearing screenshots, and keeping your camera roll clutter-free — all with on-device AI.",
};

const categoryStyles: Record<string, string> = {
  "Storage Tips": "bg-accent/10 text-accent-light",
  "Photo Organization": "bg-primary/10 text-primary-light",
  Privacy: "bg-cta/10 text-cta",
  General: "bg-background-muted text-foreground-subtle",
};

export default function BlogListPage() {
  const posts = getAllPosts();

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* ---------- Background glow orbs (matches hero) ---------- */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[5%] h-[500px] w-[450px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute right-[-10%] top-[15%] h-[500px] w-[450px] rounded-full bg-glow-pink/10 blur-[120px]" />
      </div>

      {/* ---------- Hero band ---------- */}
      <div className="relative z-10 border-b border-border px-6 py-20">
        <div className="mx-auto flex max-w-[960px] flex-col items-center gap-4 text-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary-light">
            Unpile Blog
          </span>
          <h1 className="text-[clamp(32px,4.5vw,56px)] font-bold leading-[1.1] tracking-tight text-foreground">
            Free up space.
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Keep what matters.
            </span>
          </h1>
          <p className="max-w-[480px] text-base leading-relaxed text-foreground-muted">
            Practical guides on clearing iPhone storage, spotting duplicate
            photos, and decluttering your camera roll — all on-device, no
            uploads required.
          </p>
        </div>
      </div>

      {/* ---------- Post grid ---------- */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        {posts.length === 0 ? (
          <p className="py-20 text-center text-foreground-subtle">
            No posts yet — check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-3xl border border-white/5 bg-[#151520] no-underline transition-all duration-300 hover:border-primary/40 hover:shadow-[0_8px_32px_rgba(139,92,246,0.15)]"
              >
                <div className="flex flex-1 flex-col gap-4 p-6">
                  {/* Category + read time */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                        categoryStyles[post.category] ??
                        categoryStyles.General
                      }`}
                    >
                      {post.category}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-foreground-subtle">
                      <Clock size={11} />
                      {post.readTime}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-[17px] font-bold leading-snug tracking-tight text-white transition-colors group-hover:text-primary-light line-clamp-3">
                    {post.title}
                  </h2>

                  {/* Description */}
                  <p className="line-clamp-3 flex-1 text-[13px] leading-relaxed text-foreground-muted">
                    {post.description}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <span className="flex items-center gap-1.5 text-[11px] text-foreground-subtle">
                      <Calendar size={11} />
                      {new Date(post.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span className="flex items-center gap-1 text-[12px] font-semibold text-primary-light">
                      Read
                      <ArrowRight
                        size={12}
                        strokeWidth={2.5}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}