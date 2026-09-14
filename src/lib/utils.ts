import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Previously `export { cn } from "cn"`, which resolved to an unrelated npm
// package that ships a CLI. Tailwind class conflicts were never being resolved.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
