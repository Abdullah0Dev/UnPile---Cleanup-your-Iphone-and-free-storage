import { getPostBySlug, getAllPosts } from "@/lib/blog";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import remarkGfm from "remark-gfm";
import Link from "next/link";

function getBaseUrl(): string {
  return "https://unpile.vercel.app";
}

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}
//  
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  const baseUrl = getBaseUrl();
  const postUrl = `${baseUrl}/blog/${slug}`;
  const ogImage = `${baseUrl}/images/card.png`;

  return {
    title: `${post.title} | Unpile`,
    description: post.description,
    keywords: post.keywords,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url: postUrl,
      siteName: "Unpile",
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [ogImage],
    },
    alternates: {
      canonical: postUrl,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* ---------- Header band ---------- */}
      <div className="relative overflow-hidden border-b border-border px-6 py-16">
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-80 w-[400px] -translate-x-1/2 rounded-full bg-primary opacity-20 blur-[100px]" />

        <div className="relative z-10 mx-auto flex max-w-[720px] flex-col gap-5">
          <Link
            href="/blog"
            className="flex w-fit items-center gap-1.5 text-[12px] font-medium text-foreground-subtle transition-colors hover:text-primary-light no-underline"
          >
            <ArrowLeft size={13} />
            Back to blog
          </Link>

          <span className="w-fit text-[11px] font-bold uppercase tracking-[0.18em] text-primary-light">
            {post.category}
          </span>

          <h1 className="text-[clamp(26px,3.5vw,44px)] font-bold leading-[1.15] tracking-tight text-foreground">
            {post.title}
          </h1>

          <p className="max-w-[560px] text-sm leading-relaxed text-foreground-muted">
            {post.description}
          </p>

          <div className="flex items-center gap-4 pt-1">
            <span className="flex items-center gap-1.5 text-[12px] text-foreground-subtle">
              <Calendar size={12} />
              {new Date(post.date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span className="text-border">·</span>
            <span className="flex items-center gap-1.5 text-[12px] text-foreground-subtle">
              <Clock size={12} />
              {post.readTime}
            </span>
          </div>
        </div>
      </div>

      {/* ---------- Article body ---------- */}
      <div className="relative z-10 mx-auto max-w-[720px] px-6 py-14">
        <div
          className="prose prose-invert max-w-none
            prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
            prose-h2:text-[clamp(20px,2.5vw,26px)] prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-[17px] prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-foreground-muted prose-p:leading-relaxed prose-p:text-base
            prose-a:text-primary-light prose-a:no-underline hover:prose-a:underline
            prose-strong:text-foreground prose-strong:font-bold
            prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-xl
            prose-blockquote:text-foreground prose-blockquote:font-medium
            prose-li:text-foreground-muted prose-li:text-[15px]
            prose-ul:my-4 prose-li:my-1
            prose-table:w-full prose-table:border-collapse
            prose-th:border prose-th:border-border prose-th:bg-background-muted prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-foreground prose-th:text-[14px]
            prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-2 prose-td:text-[14px] prose-td:text-foreground-muted
            prose-thead:border-b-2 prose-thead:border-border
            prose-code:text-primary-light prose-code:bg-background-muted prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none
            prose-hr:border-border"
        >
          <MDXRemote
            source={post.content}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
              },
            }}
          />
        </div>

        {/* ---------- CTA ---------- */}
        <div className="mt-16 flex flex-col items-center gap-5 rounded-3xl border border-white/5 bg-[#151520] px-8 py-10 text-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary-light">
            Ready to declutter?
          </span>
          <h2 className="text-[clamp(20px,2.5vw,30px)] font-bold leading-tight text-white">
            Stop losing storage to
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              clutter you don&apos;t need.
            </span>
          </h2>
          <Link
            href="/#waitlist"
            className="rounded-full bg-cta px-6 py-2.5 text-sm font-semibold text-cta-foreground shadow-lg shadow-cta/20 transition-shadow hover:shadow-cta/40 no-underline"
          >
            Get Early Access
          </Link>
          <p className="text-[11px] text-foreground-subtle">
            100% on-device. No uploads. No tracking.
          </p>
        </div>
      </div>
    </main>
  );
}