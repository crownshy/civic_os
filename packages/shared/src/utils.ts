import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

// Normalise a filename's extension to a supported AudioFormat, or null if unsupported.
export function extractExtension(filename: string): AudioFormat | null {
	const dot = filename.lastIndexOf('.');
	if (dot < 0 || dot === filename.length - 1) return null;
	let ext = filename.slice(dot + 1).toLowerCase();
	if (ext === 'oga') ext = 'ogg';
	return (SUPPORTED as readonly string[]).includes(ext) ? (ext as AudioFormat) : null;
}
