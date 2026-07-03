import { getPostBySlug, getAllPosts } from "@/lib/blog";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import { Calendar, Clock } from "lucide-react";
import remarkGfm from "remark-gfm";
import { developmentLog } from "@/lib/utils";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function getBaseUrl(): string {
  return "https://agw-accountant.vercel.app";
}
export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  developmentLog("params: ", params);
  const { slug } = await params;

  const post = getPostBySlug(slug);
  if (!post) return {};
  const baseUrl = getBaseUrl();
  const postUrl = `${baseUrl}/blog/${slug}`;
  const imageLogo = `${baseUrl}/logo.jpeg`;

  return {
    title: `${post.title} - AGW Accountant`,
    description: post.description,
    keywords: post.keywords,
    openGraph: {
      title: `${post.title} - AGW Accountant`,
      description: post.description,
      type: "article",
      url: postUrl, // ← use the actual post URL
      siteName: "AGW Accountant",
      images: [
        {
          url: imageLogo,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} - AGW Accountant`,
      description: post.description,
      images: [imageLogo], // explicit twitter image
    },
    alternates: {
      canonical: postUrl, // ← canonical to this specific post
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
  developmentLog("post: ", post.keywords);
  // developmentLog("post: ", "[" +post.keywords.map(key => '"' + key+ '"' ).join(",") + "]");

  return (
    <main className=" min-h-screen">
      {/* ── Post header band ── */}
      {/* Post header band - dark navy like hero */}
      <div className="bg-background-dark border-b border-border-dark py-16 px-6 relative overflow-hidden">
        <div className="max-w-180 mx-auto flex flex-col gap-5 font-roboto relative z-10">
          <div className="absolute z-0 bottom-0 left-1/2 -translate-x-1/2 w-100 h-80 bg-primary opacity-20 blur-3xl rounded-full" />
          <span className="text-primary text-[11px] font-bold tracking-[0.18em] uppercase font-roboto w-fit">
            {post.category}
          </span>
          <h1 className="font-black scale-y-115 text-[clamp(24px,3.5vw,42px)] leading-[1.1] tracking-tight font-roboto text-foreground-inverted">
            {post.title}
          </h1>
          <p className="text-[#94a3b8] text-sm leading-relaxed max-w-[560px]">
            {post.description}
          </p>
          <div className="flex items-center gap-4 pt-1">
            <span className="flex items-center gap-1.5 text-[12px] text-[#94a3b8]">
              <Calendar size={12} />
              {new Date(post.date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span className="text-border-dark">·</span>
            <span className="flex items-center gap-1.5 text-[12px] text-[#94a3b8]">
              <Clock size={12} />
              {post.readTime}
            </span>
          </div>
        </div>
      </div>

      {/* ── Article body ── */}
      <div className="max-w-[720px] mx-auto px-6 py-14">
        <div
          className="prose prose-slate max-w-none 
    prose-headings:font-roboto prose-headings:font-black prose-headings:tracking-tight prose-headings:text-foreground
    prose-h2:text-[clamp(20px,2.5vw,26px)] prose-h2:mt-10 prose-h2:mb-4
    prose-h3:text-[17px] prose-h3:mt-8 prose-h3:mb-3
    prose-p:text-foreground prose-p:leading-relaxed prose-p:text-base
    prose-a:text-primary prose-a:no-underline hover:prose-a:underline
    prose-strong:text-foreground prose-strong:font-black
    prose-blockquote:border-l-primary prose-blockquote:bg-primary-light prose-blockquote:rounded-r-xl
    prose-blockquote:text-foreground prose-blockquote:font-medium
    prose-li:text-foreground prose-li:text-[15px]
    prose-ul:my-4 prose-li:my-1
    prose-table:w-full prose-table:border-collapse
    prose-th:border prose-th:border-border prose-th:bg-muted prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-foreground prose-th:text-[14px]
    prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-2 prose-td:text-[14px] prose-td:text-foreground
    prose-thead:border-b-2 prose-thead:border-border"
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

        {/* ── Demo CTA ── */}
        {/* CTA box at bottom - use primary green gradient, navy bg */}
        <div className="mt-16 rounded-2xl bg-background-dark border border-border-dark px-8 py-10 flex flex-col items-center text-center gap-5">
          <span className="text-primary text-[11px] font-bold tracking-[0.18em] uppercase font-roboto">
            Ready to Take Control?
          </span>
          <h2 className="font-black text-[clamp(20px,2.5vw,30px)] leading-tight uppercase text-foreground-inverted">
            Book a Free Consultation.
            <br />
            <span className="bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Stay HMRC Compliant.
            </span>
          </h2>
          <Button
            asChild
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Link href={"/contact"}>Book a Free Consultation →</Link>
          </Button>
          <p className="text-[11px] text-[#94a3b8]">
            No commitment. No contract. Easy to Get Started.
          </p>
        </div>
      </div>

      {/* <FooterWithReviews /> */}
      <Footer />
    </main>
  );
}
