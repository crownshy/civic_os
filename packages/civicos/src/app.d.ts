// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Error {
			message: string;
		}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface ImportMetaEnv {
		readonly PUBLIC_POLIS_URL: string;
	}

	interface ImportMeta {
		readonly env: ImportMetaEnv;
	}

	// Custom element declarations for web components. Inside `declare global`
	// because `export {}` below makes this file a module, so a top-level
	// interface would merge with nothing (#412).
	interface HTMLElementTagNameMap {
		'add-to-calendar-button': HTMLElement;
	}
}

export {};
