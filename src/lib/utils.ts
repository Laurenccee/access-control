import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ... the rest of your hashing code

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
