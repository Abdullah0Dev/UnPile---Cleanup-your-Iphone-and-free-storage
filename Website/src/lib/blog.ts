import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { developmentLog } from "./utils";

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  readTime: string;
  keywords: string[];
  content: string;
};

const CONTENT_DIR = path.join(process.cwd(), "src/content/blog");

export const getAllPosts = (): Omit<BlogPost, "content">[] => {
    // developmentLog("CONTENT_DIR: ", CONTENT_DIR);
  if (!fs.existsSync(CONTENT_DIR)) return [];

  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((filename) => {
      const slug = filename.replace(".mdx", "");
      const raw = fs.readFileSync(path.join(CONTENT_DIR, filename), "utf-8");
      const { data } = matter(raw);
      return {
        slug,
        title: data.title,
        description: data.description,
        date: data.date,
        category: data.category ?? "General",
        readTime: data.readTime ?? "5 min read",
        keywords: data.keywords ?? [],  
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getPostBySlug = (slug: string): BlogPost | null => {
  const filepath = path.join(CONTENT_DIR, `${slug}.mdx`);
  developmentLog("filepath: ", slug);
  
  if (!fs.existsSync(filepath)) return null;

  const raw = fs.readFileSync(filepath, "utf-8");
  const { data, content } = matter(raw);

  return {
    slug,
    title: data.title,
    description: data.description,
    date: data.date,
    category: data.category ?? "General",
    readTime: data.readTime ?? "5 min read",
    keywords: data.keywords ?? [],
    content,
  };
};