// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { RegionConfig } from '$lib/config/regions';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			region: RegionConfig;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface ImportMetaEnv {
		readonly PUBLIC_CONVERSATION_ID: string;
		readonly PUBLIC_INVITE_ID: string;
		readonly PUBLIC_POLIS_URL: string;
		readonly PUBLIC_POLIS_ID: string;
	}

	interface ImportMeta {
		readonly env: ImportMetaEnv;
	}
}

// Custom element declarations for web components
interface HTMLElementTagNameMap {
	'add-to-calendar-button': HTMLElement;
}

export {};
