/* eslint-disable @typescript-eslint/no-explicit-any */
// These Question FROM: https://findquestions.com
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import OpenAI from "openai";
import dotenv from "dotenv";
import { searchPexelsImages } from "@/lib/pexels";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

dotenv.config();

// OpenRouter client (use Claude models through their gateway)
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
  defaultHeaders: {
    "HTTP-Referer": "https://devminds.com", // your site URL (optional)
    "X-Title": "DevMinds Blog Generator", // your app name (optional)
  },
});

const BLOG_DIR = path.join(process.cwd(), "src/content/blog");
const DRAFT_DIR = path.join(process.cwd(), "src/content/drafts");

function getExistingSlugs(): string[] {
  const blogFiles = fs.existsSync(BLOG_DIR)
    ? fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"))
    : [];
  const draftFiles = fs.existsSync(DRAFT_DIR)
    ? fs.readdirSync(DRAFT_DIR).filter((f) => f.endsWith(".mdx"))
    : [];
  return [...blogFiles, ...draftFiles].map((f) => f.replace(".mdx", ""));
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 70);
}

function estimateReadTime(text: string): string {
  const wordsPerMinute = 200;
  const words = text.split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

function buildPrompt(question: string, relatedQuestions: string[]): string {
  const today = new Date().toISOString().split("T")[0];
  const relatedQuestionsText =
    relatedQuestions.length > 0
      ? relatedQuestions.map((q) => `- ${q}`).join("\n")
      : "- (none available - skip the FAQ section and the related-question subheadings entirely, no need to invent extras)";

  return `You are a senior content strategist writing for AGW Accountants - a chartered accountancy and tax advisory practice serving UK businesses, sole traders, and self-employed professionals (small business owners, freelancers, contractors, taxi drivers, takeaway/restaurant owners, and other SMEs). You write blog posts that genuinely answer real search questions well enough to rank in Google and get quoted by AI answer engines. The firm is secondary - if a section would still be useful with the firm's name deleted from it, you've done it right.

## TARGET QUESTION
"${question}"
The whole article exists to answer this. Title = near-verbatim match (max 65 chars). No vague paraphrasing.

## RESEARCH FIRST
Before writing, search the web for 1-2 current, real stats tied directly to this question (HMRC, ICAEW, ACCA, FSB, Gov.uk, ONS, Federation of Small Businesses, or relevant trade/industry bodies). Verify the date and source. Never invent a stat - if you can't find one, write the point in plain reasoning instead.

## OPENING - GET THIS RIGHT
Do not open with a generic "tax season is stressful" scene unless the question is literally about deadlines or stress. The hook must come from the specific question being asked - a real number, a common mistake, a direct claim, or the actual tension in that question. Then in 40-60 words, answer the question directly and completely - no "it depends" hedging, name the subject directly (not "it"), and make the stat-backed claim if you have one. Someone reading only this paragraph should walk away with the real answer.

BAD: "Tax deadlines creep up fast, and before you know it, you're scrambling for receipts." (generic, not about the question)
GOOD for "do I need an accountant as a sole trader": "A sole trader doesn't legally need an accountant, but most who skip one end up either overpaying tax or missing HMRC deadlines that trigger automatic penalties."

## STRUCTURE
1. **Direct answer** (above) - ~120 words total and ALWAYS ANSWER THE QUESTION, NO INTRODUCTION
2. **Why it matters** - real financial/compliance impact, cited stats
3. **Root causes** - why this is genuinely hard for business owners and self-employed individuals (no finance background, irregular income, changing HMRC rules, time pressure, fear of getting it wrong). Use a related question as a subheading if it fits.
4. **Practical solutions** - 3-5 honest options including free/DIY routes (HMRC's own guidance, free software, doing it yourself) and real alternatives (other accountants, online bookkeeping platforms). AGW Accountants is one option here, not crowned the winner yet. Comparison table welcome.
5. **Where AGW Accountants fits** (~15-20% of article) - what the firm does, who it suits, where it's a poor fit. No verbatim service-list dump.
6. **Social proof** (optional) - one real testimonial, only if it supports a point already made
7. **FAQ** - 2-4 unused related questions, H3 + 2-4 direct sentences each, firm mentioned only when it's the honest answer
8. **CTA** - one calm link to book a free consultation, no urgency language

## VOICE
Straight-talking, plain English, second person. No jargon without explanation, no sales hype, no rhetorical questions for effect, no forced metaphors. Vary sentence length. It's fine to say a free or DIY option works for some people - honesty beats persuasion. Every paragraph should stand alone if quoted - name the firm or the topic directly instead of "it."

## MUST TO DO
Start with an image related to the topic before talking like: ![tax advice image](https://www.pnbmetlife.com/content/dam/pnb-metlife/webp/article/tax-planning.webp)

## FORMAT - YOU MUST MATCH IT
MDX only, no preamble. Frontmatter:
---
title: "MATCH the question"
description: "180-200 chars, primary keyword + concrete benefit"
date: "${today}"
category: "Tax Planning & Compliance"
readTime: "X min read"
keywords: ["...6 keywords..."]
faqs:
  - question: "..."
    answer: "Plain text, 1-2 sentences"
---
## for sections, ### for subsections. Paragraphs 2-4 sentences. Bullets max 5-6 before breaking into prose. Bold sparingly. 1,300-1,700 words total. Two CTA links (mid-article after solutions, and at the end).

## STATS
Every major claim needs a real, sourced stat from your search - cite inline like *(Source: HMRC, 2026)*. No fabricated numbers, studies, or testimonials, ever - cut the claim if you can't verify it.

## IMAGES
1-3 real, resolvable Unsplash/Pexels/Pixabay URLs showing relevant working contexts (small business owners, bookkeeping, office/desk work, self-employed tradespeople doing admin). Format: ![Alt text](url).

## AGW Accountants - PRODUCT REFERENCE (use only when genuinely relevant)
**What it does:** comprehensive accounting (bookkeeping, financial statements, payroll); tax planning & compliance (corporate tax, VAT, self-assessment); new company registration and UK incorporation support; visa application financial documentation; audits & business advisory; personal tax planning for self-employed individuals, sole traders, taxi drivers, and takeaway/SME owners. Chartered accountants and ACCA professionals with Big 4 experience, fully HMRC compliant.

**Who it suits:** sole traders and freelancers needing self-assessment and bookkeeping support; small business owners needing payroll, VAT, and year-round tax advice; start-ups needing company registration and first-year accounts; individuals needing financial documentation for visa applications.

**Where it's a poor fit:** very large corporates needing in-house finance teams; anyone wanting a one-off DIY filing with no ongoing relationship (point them to HMRC's free tools instead, honestly).

**CTA link:** https://agwaccountants.co.uk/

## RELATED QUESTIONS (use 2-5 as subheadings or FAQ)
${relatedQuestionsText}`;
}

// RULES:
// - **Never use raw '<' or '>' characters.** Write '&lt;' and '&gt;' instead, especially in comparisons like '<2%' or '>100 calls

// Helper to call Claude via OpenRouter
async function callClaude(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number,
): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "meta-llama/llama-3.3-70b-instruct", // deepseek/deepseek-chat "~anthropic/claude-sonnet-latest")
    // max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });

  return completion.choices[0]?.message?.content?.trim() ?? "";
}
async function pickBestTopic(candidates: string[]): Promise<string> {
  const systemPrompt = `You are an SEO strategist specializing in UK small business content. 
Your task: from a list of blog topic candidates, pick the single best one for Dev Minds - a Website & Marketing Systems  service for UK tradesmen (plumbers, electricians, HVAC, roofers).

Score each topic against these criteria:
1. High UK Google search volume (biz owners actually searching this)
2. Clear commercial intent - someone reading this is likely to buy or book a demo
3. Not already saturated by big brands
4. Directly relevant to biz owner, accounting

Return ONLY the exact topic text as it appears in the list. No quotes, no numbering, no explanation.`;

  const userMessage =
    candidates.map((t, i) => `${i + 1}. ${t}`).join("\n") +
    `\n\nReturn only the single best topic, exactly as written above.`;

  const response = await callClaude(systemPrompt, userMessage, 80);
  const chosen = response.trim().replace(/^["'\d.\s]+|["']$/g, "");

  const exact = candidates.find(
    (c) => c.toLowerCase().trim() === chosen.toLowerCase().trim(),
  );
  if (exact) return exact;

  const partial = candidates.find((c) =>
    c.toLowerCase().includes(chosen.toLowerCase()),
  );
  if (partial) return partial;

  console.warn(
    "⚠️ AI topic pick didn't match. Falling back to first candidate.",
  );
  return candidates[0];
}
async function optimizeKeywordsForUS(mdxContent: string): Promise<string> {
  const { data, content } = matter(mdxContent) as {
    data: { [key: string]: any };
    content: string;
  };

  const systemPrompt = `You are a UK SEO specialist. Generate exactly 6 keywords for a blog post about Accounting.

RULES - follow every one:
- All 6 must reflect real UK Google search intent (what biz owners actually type)
- Mix: 2 short-tail (2–3 words), 4 long-tail (4–7 words)
- At least 3 must include a business owners type (e.g. "for biz owner UK",)
- Every keyword must have commercial or informational intent - no vague generic terms
- Do NOT include: "AI", "technology", "innovation", "digital", "solution" as standalone words
- Do NOT add any explanation, markdown, or extra text

Return ONLY this exact format on one line:
["keyword one", "keyword two", "keyword three", "keyword four", "keyword five", "keyword six"]`;

  const userMessage = `Title: "${data.title || ""}"
Description: "${data.description || ""}"
Content preview: ${content.slice(0, 1500)}`;

  const rawKeywords = await callClaude(systemPrompt, userMessage, 120);

  // Extract JSON array - handle both bare array and keywords: [...] format
  const arrayMatch = rawKeywords.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed) && parsed.length === 6) {
        data.keywords = parsed;
        return matter.stringify(content, data);
      }
    } catch {
      console.warn("⚠️ Failed to parse keyword JSON. Keeping originals.");
    }
  }

  console.warn("⚠️ No valid keyword array found. Keeping originals.");
  return mdxContent;
}
function extractValidMDX(raw: string): string {
  const trimmed = raw.trim();

  // 1. Find the first valid frontmatter block (title: must be present) – your existing logic
  let startIndex = -1;
  const lines = trimmed.split("\n");

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      let hasTitle = false;
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim() === "---") break; // end of frontmatter
        if (lines[j].includes("title:")) {
          hasTitle = true;
          break;
        }
      }
      if (hasTitle) {
        startIndex = i;
        break;
      }
    }
  }

  if (startIndex === -1) {
    console.warn(
      "⚠️ No valid frontmatter block with 'title:' found. Using raw output.",
    );
    startIndex = 0;
  }

  let contentLines = lines.slice(startIndex);

  // 2. Remove trailing AI sign‑off after ``` fence

  // Find the last potential fence marker:  ```
  let fenceIndex = -1;
  for (let i = contentLines.length - 1; i >= 0; i--) {
    const line = contentLines[i].trim();
    if (line === "```") {
      fenceIndex = i;
      break;
    }
  }

  if (fenceIndex !== -1) {
    // Check if everything after the fence is only AI chatter (or empty)
    contentLines = contentLines.slice(0, fenceIndex);
  }

  // 3. Final cleanup: remove trailing empty lines
  while (
    contentLines.length > 0 &&
    contentLines[contentLines.length - 1].trim() === ""
  ) {
    contentLines.pop();
  }

  return contentLines.join("\n").trim();
}
async function replaceImagesWithPexels(mdxContent: string): Promise<string> {
  // Regex to match ![alt](url) - handles optional title, but we ignore it
  const imageRegex = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let match;
  let newContent = mdxContent;

  // Collect all matches first (to avoid overlapping replacements)
  const replacements: { original: string; alt: string; url: string }[] = [];
  while ((match = imageRegex.exec(mdxContent)) !== null) {
    const fullMatch = match[0];
    const alt = match[1].trim() || "tradesman working"; // fallback if alt is empty
    const currentUrl = match[2];
    replacements.push({ original: fullMatch, alt, url: currentUrl });
  }

  if (replacements.length === 0) return mdxContent; // no images

  // For each image, try to get a Pexels photo
  for (const { original, alt } of replacements) {
    const searchKeyword = `man ${alt}`;
    const images = await searchPexelsImages(searchKeyword, 1);
    if (images.length > 0) {
      const newImageMarkdown = `![${alt}](${images[0].imageUrl})`;
      newContent = newContent.replace(original, newImageMarkdown);
      console.log(`🖼️ Replaced image for alt "${alt}" with Pexels photo`);
    } else {
      console.log(
        `⚠️ No Pexels image found for alt "${alt}", keeping original.`,
      );
    }
  }

  return newContent;
}
async function escapeMDXSpecialChars(mdx: string) {
  // Split into frontmatter and content
  const frontmatterMatch = mdx.match(/^---[\s\S]*?---/);
  if (!frontmatterMatch) return mdx;

  const frontmatter = frontmatterMatch[0];
  let content = mdx.slice(frontmatter.length);

  // Escape < and > only when they're NOT part of HTML/JSX tags
  content = content.replace(/([^=<!"'\/a-zA-Z])<(\d)/g, "$1&lt;$2");
  content = content.replace(/(\d)>([^=<!"'\/a-zA-Z])/g, "$1&gt;$2");

  return frontmatter + content;
}

export function fixMDXLinks(mdx: string): string {
  // **[text]**(url) → [**text**](url)
  mdx = mdx.replace(/\*\*\[([^\]]+)\]\*\*\(([^)]+)\)/g, "[**$1**]($2)");

  // **[text](url) → [**text**](url)
  mdx = mdx.replace(/\*\*\[([^\]]+)\]\(([^)]+)\)/g, "[**$1**]($2)");

  // [**text**](url)
  mdx = mdx.replace(/\[\*\*([^\]]+)\*\*\(([^)]+)\)/g, "[**$1**]($2)");
  // [text](url)** → [**text**](url)
  mdx = mdx.replace(/\[([^\]]+)\]\(([^)]+)\)\*\*/g, "[**$1**]($2)");

  // <https://url> → [https://url](https://url)
  mdx = mdx.replace(/<(https?:\/\/[^>]+)>/g, "[$1]($1)");

  // ] ( → ](
  mdx = mdx.replace(/\]\s+\(/g, "](");

  return mdx;
}

async function run(): Promise<void> {
  // const text = ` [**book a free call with Dev Minds**(https://devmindslab.com/contact)`;

  // const output = fixMDXLinks(text);
  // console.log("output: ", output);

  // return;
  console.log("🔍 Fetching trending topics…");
  const existingSlugs = getExistingSlugs();
  let questions = [
    "How Much Does a UK Tax Accountant Cost?",
    "Do You Really Need an Accountant for Your Limited Company?",
    "What Does a Corporate Tax Accountant Actually Do?",
    "How to Choose the Right Tax Accountant for Your Business",
    "Questions to Ask Before Hiring a Tax Accountant",
    "Self-Assessment Tax: Should You Use an Accountant?",
    "How Much Should You Pay for Corporation Tax Filing?",
    "Finding a Specialist Accountant for Your Industry",
    "What Information Do You Need to Give Your Accountant?",
    "Monthly vs Annual Accountant Fees: What's Better?",
    "Can You File Company Accounts Without an Accountant?",
    "Red Flags When Choosing a Tax Accountant",
    "How to Find a Trustworthy Local Accountant",
    "Accountant Fees for Small Businesses: What's Reasonable?",
    "What's Included in Standard Accountant Packages?",
    "Should You Hire an Accountant or Use Accounting Software?",
    "How to Prepare Your Books for Your Accountant",
    "What Questions Should Your Accountant Ask You?",
    "UK Tax Accountant for Freelancers and Self-Employed",
    "How Often Should You Meet With Your Accountant?",
    "Accountant vs Bookkeeper: What's the Difference?",
    "Getting Started: Your First Meeting With a Tax Accountant",
    "Can a Tax Accountant Save You Money?",
    "How to Spot an Overqualified Accountant for Your Needs",
    "Accountant Costs for Directors and Company Owners",
    "What Happens If You Don't File Company Accounts?",
    "How Long Does It Take an Accountant to File Your Taxes?",
    "Emergency Tax Accountant: When You Need Help Fast",
    "Managing Multiple Business Ventures: Accountant Help",
    "Tax Accountant for Directors With Multiple Income Streams",
    "How to Negotiate Accountant Fees",
    "Switching Accountants: What You Need to Know",
    "Virtual vs In-Person Accountants: What's Best?",
    "What Makes a Good Tax Accountant?",
    "Accountant Fees: Fixed Price vs Hourly Rates",
    "Do You Need a Qualified Accountant or Just a Bookkeeper?",
    "Tax Accountant Red Flags: Signs to Avoid",
    "How Much Does an Accountant Cost for a Start-Up?",
    "Getting Your First Accountant: A Beginner's Guide",
    "What Documents Should You Keep for Your Accountant?",
    "End-of-Year Accounting Checklist",
    "Common Tax Mistakes Accountants See",
    "How to Stay Organized Between Accountant Meetings",
    "Accountant Communication Best Practices",
    "Understanding Your Tax Return From Your Accountant",
    "When to Upgrade From DIY Accounting",
    "Accountant Credentials and Qualifications Explained",
    "Seasonal Accounting Needs",
    "Accountant Services for Growing Businesses",
    "Building a Long-Term Relationship With Your Accountant",
  ];
  if (questions.length === 0) {
    console.log(
      "⚠️  No trending questions fetched. Falling back to Claude brainstorming.",
    );
    const fallbackPrompt = `Generate 5 blog topic ideas for "AI receptionist for tradesmen" that are NOT about these slugs: ${existingSlugs.join(", ")}. Return only the list, one per line.`;
    const fallbackText = await callClaude(
      "You generate blog topic ideas.",
      fallbackPrompt,
      200,
    );
    questions = fallbackText
      .split("\n")
      .map((l) => l.replace(/^\d+\.\s*/, ""))
      .filter((l) => l.trim().length > 0);
  }

  // 1. Filter only unique topics
  const uniqueTopics = questions.filter(
    (q) => !existingSlugs.includes(slugify(q)),
  );

  let selected: string | null = null;

  if (uniqueTopics.length === 0) {
    console.log(
      "✅ No new topics to write. All trending ideas are already covered.",
    );
    return;
  } else if (uniqueTopics.length === 1) {
    selected = uniqueTopics[0];
  } else {
    console.log(
      `🤖 Asking Claude to pick the best topic from ${uniqueTopics.length} candidates…`,
    );
    selected = await pickBestTopic(uniqueTopics);
    console.log(`⭐ AI selected: "${selected}"`);
  }

  if (!selected) {
    console.log(
      "✅ No new topics to write. All trending ideas are already covered.",
    );
    return;
  }

  // 2. Related questions = everything else in the original list,
  //    minUK the one we're writing about, minUK anything already published.
  //    Dedupe defensively in case the source list ever repeats itself.
  const seen = new Set<string>();
  const relatedQuestions = questions.filter((q) => {
    if (q === selected) return false;
    if (existingSlugs.includes(slugify(q))) return false;
    const key = q.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`✍️  Generating post for: "${selected}"`);
  console.log(
    `🔗 With ${relatedQuestions.length} related question(s) for subheadings/FAQ.`,
  );

  const rawPost = await callClaude(
    "You write perfectly formatted MDX blog posts with exact frontmatter.",
    buildPrompt(selected, relatedQuestions),
    2500,
  );

  const cleanPost = extractValidMDX(rawPost);
  const { data, content } = matter(cleanPost);
  data.readTime = estimateReadTime(content);
  let finalMDX = matter.stringify(content, data);

  // Step: replace keywords with US-optimised ones
  try {
    console.log(
      " Optimizing keywords for UK market… & removing any problems <>",
    );
    finalMDX = await optimizeKeywordsForUS(finalMDX);
    finalMDX = await escapeMDXSpecialChars(finalMDX);
    finalMDX = fixMDXLinks(finalMDX);

    console.log("✅ Keywords updated.");
  } catch (e) {
    console.warn("⚠️ Keyword optimization failed, using original keywords.");
  }
  try {
    console.log("🔍 Enhancing images with Pexels…");
    finalMDX = await replaceImagesWithPexels(finalMDX);
    console.log("✅ Images enhanced.");
  } catch (e) {
    console.warn("⚠️ Pexels image replacement failed, using original images.");
  }
  const slug = slugify(selected);
  // make it on public
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);

  if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR, { recursive: true });

  fs.writeFileSync(filePath, finalMDX);
  console.log(`💾 Draft saved: ${filePath}`);
}

run().catch(console.error);
// async function test() {
//   const filePath = path.join(
//     BLOG_DIR,
//     `best-virtual-receptionist-for-electricians.mdx`,
//   );
//   const raw = fs.readFileSync(filePath, "utf-8");
//   const fixed = fixMDXLinks(raw);
//   fs.writeFileSync(filePath, fixed);
//   console.log(`💾 Fixed and saved: ${filePath}`);
// }
// test();
