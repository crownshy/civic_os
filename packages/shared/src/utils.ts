import {type ClassValue, clsx} from 'clsx';
import {extendTailwindMerge} from 'tailwind-merge';

// Custom `--text-*` sizes from admin's app.css. Unregistered, tailwind-merge reads
// `text-body` as a colour and keeps a primitive's `md:text-sm` next to it.
const twMerge = extendTailwindMerge({
	extend: {
		theme: {
			text: [
				'h1',
				'h2',
				'h3',
				'h4',
				'body-lg',
				'body',
				'paragraph',
				'caption',
				'label',
				'stat',
				'hero',
				'section',
				'display'
			]
		}
	}
});

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

export function uploadToSignedUrl(
    file: File,
    url: string,
    onProgress: (pct: number) => void
): Promise<void> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', url, true);
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                onProgress(100);
                resolve();
            } else {
                reject(new Error(`Upload failed (${xhr.status})`));
            }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(file);
    });
}