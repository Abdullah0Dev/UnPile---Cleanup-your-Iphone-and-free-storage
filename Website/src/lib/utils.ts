import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const isProduction = process.env.NODE_ENV === "production";

export const isMobile =  typeof window !== "undefined" && window.innerWidth <= 640;
// &&
// window.matchMedia("(hover: none)").matches;

export function developmentLog(...props: unknown[]) {
  if (isProduction) return;
  console.log(...props);
}

export function developmentError(...props: unknown[]) {
  if (isProduction) return;
  console.error(...props);
}
