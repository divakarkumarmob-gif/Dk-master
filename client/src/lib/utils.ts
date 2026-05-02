import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getEmailPrefix(email: string | null | undefined, fallback: string = 'Anonymous'): string {
    if (!email || typeof email !== 'string') return fallback;
    return email.split('@')[0] || fallback;
}
