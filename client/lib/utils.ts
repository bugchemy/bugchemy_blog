import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// client/lib/utils.ts
// keep any existing helpers you already have above this code.
// Below we add a safe, well-behaved extractHeadings export.

export type Heading = { level: number; text: string; slug: string };

export function extractHeadings(markdown: string): Heading[] {
  if (!markdown) return [];
  const lines = markdown.split("\n");
  return lines
    .filter((line) => /^#{1,6}\s+/.test(line))
    .map((line) => {
      const m = line.match(/^(#+)\s+(.*)/);
      const level = m ? m[1].length : 1;
      const text = m ? m[2].trim() : line.trim();
      const slug = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "") // remove punctuation
        .trim()
        .replace(/\s+/g, "-") // spaces -> dashes
        .replace(/-+/g, "-"); // collapse dashes
      return { level, text, slug };
    });
}
