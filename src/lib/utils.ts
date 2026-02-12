import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"


const removeInvisibleChars = (str: string): string => 
  str.replace(/[\u200B-\u200D\uFEFF]/g, "");

export const nameKey = (raw:string): string => 
  removeInvisibleChars(raw)
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, '');


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Normalize the display namne
export const normalizeName = (raw: string): string => 
        removeInvisibleChars(raw)
          .normalize("NFC")
          .trim()
          .replace(/\s+/g, ' '); // Collapse multiple spaces to single space

export const normalizeSpaces = (s: string) => s.trim().replace(/\s+/g, ' ');
export const normalizePostal = (s: string) => s.trim().toUpperCase().replace(/\s+/g, '');
