import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import { Calendar, Clock, ArrowRight, Tag } from "lucide-react";

export const metadata = {
  title: "Blogs - DWG Accountant",
  description:
    "Tips, guides, and insights for tradesmen on growing their business and never missing a job.",
};

const categoryColors: Record<string, string> = {
  "Business Growth": "bg-primary/10 text-primary",
  "AI & Technology": "bg-accent/10 text-accent",
  "Case Studies": "bg-[var(--green-soft-bg)] text-[var(--green-soft-text)]",
  General: "bg-background-muted text-muted-foreground",
};

export default function BlogListPage() {
  const posts = getAllPosts();

  return (
    <main className="bg-background min-h-screen">
      {/* ── Hero band ── */}
      <div className="bg-background-dark border-b border-border-dark py-20 px-6">
        <div className="max-w-[960px] font-roboto mx-auto flex flex-col items-center text-center gap-4">
          <span className="text-primary text-[11px] font-bold tracking-[0.18em] uppercase">
            DWG Accountant Blog
          </span>
          <h1 className="font-black uppercase scale-y-110 text-[clamp(28px,4vw,72px)] leading-[1.05] tracking-tight text-foreground-inverted">
            Insights for
            <br />
            <span className="bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Business Owners Who Mean Business.
            </span>
          </h1>
          <p className="text-[#94a3b8] text-base leading-relaxed max-w-[440px]">
            Tips, guides, and real-world advice on accounting, tax planning, and
            growing your business.
          </p>
        </div>
      </div>

      {/* ── Post grid ── */}
      <div className="max-w-260 mx-auto px-6 py-16">
        {posts.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">
            No posts yet - check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {posts.map((post, i) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col rounded-2xl border border-border bg-background hover:border-primary hover:shadow-[0_4px_24px_rgba(16,185,129,0.12)] transition-all duration-300 overflow-hidden no-underline"
              >
                {/* Colour band top */}
                <div className={`h-1.5 w-full bg-primary`} />

                <div className="flex flex-col gap-4 p-6 flex-1">
                  {/* Category + read time */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-black tracking-[0.12em] uppercase font-roboto px-2.5 py-1 rounded-full ${
                        categoryColors[post.category] ?? categoryColors.General
                      }`}
                    >
                      {post.category}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock size={11} />
                      {post.readTime}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="font-black text-[15px] font-montserrat text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-3">
                    {post.title}
                  </h2>

                  {/* Description */}
                  <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-3 flex-1">
                    {post.description}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Calendar size={11} />
                      {new Date(post.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span className="flex items-center gap-1 text-[12px] font-bold text-primary font-montserrat">
                      Read
                      <ArrowRight size={12} strokeWidth={2.5} />
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
